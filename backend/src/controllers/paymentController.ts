import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { AuthRequest } from '../middleware/authMiddleware';
import { Role, PaymentStatus, FareStatus, RequestStatus } from '@prisma/client';
import { currentMonth } from '../utils/time';
import { parseFee, createNotification, lockStudentDriver } from '../services/fareService';
import { payhereConfig, payhereEnabled, onlinePaymentsEnabled, PAYMENTS_COMING_SOON, checkoutUrl, generateCheckoutHash, verifyNotifySignature } from '../services/payhere';
import { emitFareUpdated } from '../socketHandler';
import { getCommissionRate } from '../services/settingsService';
import { sendEmail, emails } from '../services/email';
import { signToken, verifyToken } from '../utils/jwt';
import { serverError } from '../utils/httpError';

// Marks a monthly payment COMPLETED: credits the driver's wallet with the net
// amount, settles the month's fare, notifies the driver.
//
// Safe to call more than once for the same payment (PayHere retries its
// callback): only the first call settles anything. If the month was already
// settled by a different payment — e.g. the driver recorded cash while this
// checkout was still open — the money is kept on record but nothing is
// credited twice, and the student is told a refund is due.
const completePayment = async (paymentId: number, referenceNo?: string) => {
  // Cast, not annotation: assignments inside the transaction callback below
  // would otherwise leave TypeScript narrowing this to 'noop'.
  let outcome = 'noop' as 'settled' | 'duplicate' | 'noop';

  const payment = await prisma.$transaction(async (tx) => {
    const found = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!found || found.status === PaymentStatus.COMPLETED || !found.month) return found;

    await lockStudentDriver(tx, found.studentId, found.driverId);
    // Re-read under the lock: a concurrent retry may have completed it.
    const p = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!p || p.status === PaymentStatus.COMPLETED || !p.month) return p;

    const fareKey = { studentId_driverId_month: { studentId: p.studentId, driverId: p.driverId, month: p.month } };
    const fare = await tx.monthlyFare.findUnique({ where: fareKey });

    if (fare?.status === FareStatus.PAID && fare.paymentId !== p.id) {
      outcome = 'duplicate';
      return tx.payment.update({
        where: { id: p.id },
        data: {
          status: PaymentStatus.COMPLETED,
          adminCommission: 0,
          paymentDate: new Date(),
          referenceNo: `REFUND-DUE-${referenceNo ?? p.id}`
        }
      });
    }

    const updated = await tx.payment.update({
      where: { id: p.id },
      data: {
        status: PaymentStatus.COMPLETED,
        paymentDate: new Date(),
        ...(referenceNo ? { referenceNo } : {})
      }
    });
    await tx.driver.update({
      where: { id: p.driverId },
      data: { walletBalance: { increment: p.amount - p.adminCommission } }
    });
    await tx.monthlyFare.upsert({
      where: fareKey,
      create: {
        studentId: p.studentId,
        driverId: p.driverId,
        month: p.month,
        status: FareStatus.PAID,
        amount: p.amount,
        markedBy: 'STUDENT_APP',
        paymentId: p.id
      },
      update: { status: FareStatus.PAID, amount: p.amount, markedBy: 'STUDENT_APP', paymentId: p.id }
    });
    outcome = 'settled';
    return updated;
  });

  if (payment && outcome === 'duplicate') {
    console.warn(`[payments] payment ${payment.id} arrived after ${payment.month} was already settled; refund due`);
    const student = await prisma.student.findUnique({
      where: { id: payment.studentId },
      include: { user: { select: { email: true } } }
    });
    if (student) {
      await createNotification(
        student.userId,
        'Duplicate Payment — Refund Due',
        `Your card payment of LKR ${payment.amount.toFixed(2)} for ${payment.month} went through after the month had already been paid, so you were charged twice. Contact support to have the card payment refunded.`
      );
      void sendEmail(emails.duplicatePaymentRefund(
        student.user.email, student.fullName, payment.month!, payment.amount, payment.referenceNo ?? String(payment.id)
      ));
    }
  }

  if (payment && outcome === 'settled') {
    const [driver, student] = await Promise.all([
      prisma.driver.findUnique({ where: { id: payment.driverId }, include: { user: { select: { id: true } } } }),
      prisma.student.findUnique({ where: { id: payment.studentId }, include: { user: { select: { email: true } } } })
    ]);
    if (driver && student) {
      await createNotification(
        driver.user.id,
        'Fare Payment Received',
        `${student.fullName} paid the ${payment.month} fare (LKR ${payment.amount.toFixed(2)}) through the app.`
      );
      emitFareUpdated(driver.id, { studentId: payment.studentId, month: payment.month, status: FareStatus.PAID });
      void sendEmail(emails.paymentReceipt(student.user.email, student.fullName, {
        description: emails.monthlyFareLabel(payment.month!),
        amount: payment.amount,
        method: payment.paymentMethod,
        reference: payment.referenceNo,
        paidTo: driver.fullName
      }));
    }
  }
  return payment;
};

// Shared validation: the student's approved assignment + this month's fee.
const resolveDueFare = async (userId: number) => {
  const student = await prisma.student.findUnique({ where: { userId } });
  if (!student) return { error: 'Student profile not found', code: 404 as const };

  const assignment = await prisma.seatRequest.findFirst({
    where: { studentId: student.id, status: RequestStatus.APPROVED },
    include: { driver: { include: { user: { select: { id: true } } } } }
  });
  if (!assignment) return { error: 'You need an approved bus assignment before you can pay.', code: 400 as const };

  const amount = parseFee(assignment.driver.monthlyFee);
  if (amount <= 0) return { error: 'This driver has not set a valid monthly fee yet.', code: 400 as const };

  const month = currentMonth();
  const fare = await prisma.monthlyFare.findUnique({
    where: { studentId_driverId_month: { studentId: student.id, driverId: assignment.driverId, month } }
  });
  if (fare?.status === FareStatus.PAID) return { error: `You have already paid for ${month}.`, code: 400 as const };

  return { student, driver: assignment.driver, month, amount };
};

// POST /api/payments/initiate
// Starts a payment for the current month. The amount and month are decided
// by the server (the driver's fixed monthly fee) — never by the client.
// With PayHere configured, returns a card-checkout URL; otherwise (local
// dev) the payment completes immediately.
export const initiatePayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== Role.STUDENT) {
      res.status(403).json({ error: 'Only students can make a payment' });
      return;
    }
    if (!onlinePaymentsEnabled()) {
      res.status(503).json({ error: PAYMENTS_COMING_SOON, code: 'PAYMENTS_COMING_SOON' });
      return;
    }

    const resolved = await resolveDueFare(req.user.userId);
    if ('error' in resolved) {
      res.status(resolved.code).json({ error: resolved.error });
      return;
    }
    const { student, driver, month, amount } = resolved;
    const commissionRate = await getCommissionRate();
    const adminCommission = Math.round(amount * commissionRate * 100) / 100;
    const usePayhere = payhereEnabled();

    // One payment row per student/driver/month: reuse an abandoned PENDING
    // or FAILED attempt instead of violating the unique constraint.
    const existing = await prisma.payment.findFirst({
      where: { studentId: student.id, driverId: driver.id, month },
      orderBy: { paymentDate: 'desc' }
    });
    if (existing?.status === PaymentStatus.COMPLETED) {
      res.status(400).json({ error: `You have already paid for ${month}.` });
      return;
    }

    const data = {
      amount,
      adminCommission,
      status: PaymentStatus.PENDING,
      paymentMethod: usePayhere ? 'PAYHERE' : 'IN_APP',
      referenceNo: null as string | null,
      // Restamped on every attempt: the cash-marking guard uses it to tell a
      // checkout in progress from an abandoned one.
      paymentDate: new Date()
    };
    const payment = existing
      ? await prisma.payment.update({ where: { id: existing.id }, data })
      : await prisma.payment.create({
          data: { studentId: student.id, driverId: driver.id, month, ...data }
        });

    if (!usePayhere) {
      // Local development fallback: settle instantly.
      const completed = await completePayment(payment.id, `APP-${Date.now()}`);
      res.status(201).json({ mode: 'DIRECT', message: 'Payment recorded successfully', payment: completed });
      return;
    }

    const token = signToken({ paymentId: payment.id, purpose: 'ph_checkout' }, '20m');
    res.status(201).json({
      mode: 'PAYHERE',
      paymentId: payment.id,
      amount,
      month,
      // Browser-facing URL — the notify callback separately uses publicUrl.
      checkoutUrl: `${payhereConfig().appUrl}/api/payments/checkout/${payment.id}?t=${token}`
    });
  } catch (error: any) {
    serverError(res, error);
  }
};

// GET /api/payments/checkout/:id?t=<token>  (public; token-gated)
// Serves an auto-submitting form that hands the student to PayHere's hosted
// card page. All values, including the amount, are server-side and signed.
export const payhereCheckout = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!payhereEnabled()) {
      res.status(404).send('PayHere is not configured.');
      return;
    }

    const paymentId = parseInt(String(req.params.id));
    let decoded: any;
    try {
      decoded = verifyToken(String(req.query.t || ''));
    } catch {
      res.status(401).send('This checkout link is invalid or has expired. Start the payment again from the app.');
      return;
    }
    if (decoded.purpose !== 'ph_checkout' || decoded.paymentId !== paymentId) {
      res.status(401).send('This checkout link is invalid.');
      return;
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        student: { include: { user: { select: { email: true, phone: true } } } },
        driver: { select: { fullName: true } }
      }
    });
    if (!payment) {
      res.status(404).send('Payment not found.');
      return;
    }
    if (payment.status === PaymentStatus.COMPLETED) {
      res.send('<h3>This month is already paid. You can close this window.</h3>');
      return;
    }

    const cfg = payhereConfig();
    const names = payment.student.fullName.trim().split(/\s+/);
    const fields: Record<string, string> = {
      merchant_id: cfg.merchantId,
      // return/cancel are opened by the student's browser; notify is called
      // by PayHere's server and must go through the public tunnel.
      return_url: `${cfg.appUrl}/api/payments/return`,
      cancel_url: `${cfg.appUrl}/api/payments/return?cancelled=1`,
      notify_url: `${cfg.publicUrl}/api/payments/notify`,
      order_id: String(payment.id),
      items: `Monthly bus fare ${payment.month} — ${payment.driver.fullName}`,
      currency: 'LKR',
      amount: payment.amount.toFixed(2),
      first_name: names[0] || 'Student',
      last_name: names.slice(1).join(' ') || '-',
      email: payment.student.user.email,
      phone: payment.student.user.phone || '0000000000',
      address: payment.student.pickupPoint || '-',
      city: payment.student.homeLocation || 'Colombo',
      country: 'Sri Lanka',
      hash: generateCheckoutHash(String(payment.id), payment.amount)
    };

    const inputs = Object.entries(fields)
      .map(([k, v]) => `<input type="hidden" name="${k}" value="${String(v).replace(/"/g, '&quot;')}">`)
      .join('\n');

    res.send(`<!DOCTYPE html><html><head><title>Redirecting to PayHere…</title></head>
<body style="font-family:sans-serif;text-align:center;padding-top:80px;background:#12141d;color:#fff">
<p>Redirecting to the secure PayHere payment page…</p>
<form id="ph" method="post" action="${checkoutUrl()}">${inputs}</form>
<script>document.getElementById('ph').submit();</script>
</body></html>`);
  } catch (error: any) {
    res.status(500).send('Server error');
  }
};

// POST /api/payments/notify  (public; called server-to-server by PayHere)
export const payhereNotify = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!payhereEnabled()) {
      res.status(404).send('Not configured');
      return;
    }

    const p = req.body || {};
    if (!verifyNotifySignature(p)) {
      console.warn('[payhere] notify with invalid signature rejected:', p.order_id);
      res.status(400).send('Invalid signature');
      return;
    }

    const paymentId = parseInt(String(p.order_id));
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) {
      res.status(404).send('Unknown order');
      return;
    }

    // Amount must match what we asked for — belt and braces on top of the hash.
    if (Math.abs(parseFloat(p.payhere_amount) - payment.amount) > 0.01) {
      console.warn('[payhere] amount mismatch rejected:', p.order_id);
      res.status(400).send('Amount mismatch');
      return;
    }

    if (String(p.status_code) === '2') {
      await completePayment(payment.id, `PAYHERE-${p.payment_id || paymentId}`);
    } else if (['-2', '-3'].includes(String(p.status_code)) && payment.status === PaymentStatus.PENDING) {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: PaymentStatus.FAILED } });
    }

    res.send('OK');
  } catch (error: any) {
    console.error('[payhere] notify error:', error);
    res.status(500).send('Server error');
  }
};

// GET /api/payments/return — where PayHere sends the student's browser back.
export const payhereReturn = (req: Request, res: Response): void => {
  const cancelled = req.query.cancelled === '1';
  res.send(`<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding-top:80px;background:#12141d;color:#fff">
<h2>${cancelled ? 'Payment cancelled' : 'Thank you!'}</h2>
<p>${cancelled ? 'No money was charged. You can retry from the app.' : 'If the payment succeeded it will appear in the app within a few seconds.'}</p>
<p>You can close this window and return to the Uni Shuttle app.</p>
</body></html>`);
};

// GET /api/payments/:id/status — lets the app poll while checkout is open.
export const getPaymentStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: req.user?.userId } });
    const payment = await prisma.payment.findUnique({ where: { id: parseInt(String(req.params.id)) } });
    if (!payment || !student || payment.studentId !== student.id) {
      res.status(404).json({ error: 'Payment not found' });
      return;
    }
    res.status(200).json({ status: payment.status, month: payment.month });
  } catch (error: any) {
    serverError(res, error);
  }
};

// POST /api/payments — legacy direct payment. Kept for local development;
// once PayHere is configured all payments must go through the card checkout.
export const createPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== Role.STUDENT) {
      res.status(403).json({ error: 'Only students can make a payment' });
      return;
    }
    if (!onlinePaymentsEnabled()) {
      res.status(503).json({ error: PAYMENTS_COMING_SOON, code: 'PAYMENTS_COMING_SOON' });
      return;
    }
    if (payhereEnabled()) {
      res.status(400).json({ error: 'Card payment is required. Use the checkout in the app.' });
      return;
    }

    const resolved = await resolveDueFare(req.user.userId);
    if ('error' in resolved) {
      res.status(resolved.code).json({ error: resolved.error });
      return;
    }
    const { student, driver, month, amount } = resolved;
    const commissionRate = await getCommissionRate();
    const adminCommission = Math.round(amount * commissionRate * 100) / 100;

    const existing = await prisma.payment.findFirst({
      where: { studentId: student.id, driverId: driver.id, month },
      orderBy: { paymentDate: 'desc' }
    });
    if (existing?.status === PaymentStatus.COMPLETED) {
      res.status(400).json({ error: `You have already paid for ${month}.` });
      return;
    }

    const data = { amount, adminCommission, status: PaymentStatus.PENDING, paymentMethod: 'IN_APP' };
    const pending = existing
      ? await prisma.payment.update({ where: { id: existing.id }, data })
      : await prisma.payment.create({ data: { studentId: student.id, driverId: driver.id, month, ...data } });

    const payment = await completePayment(pending.id, req.body?.referenceNo || `APP-${Date.now()}`);
    res.status(201).json({ message: 'Payment recorded successfully', payment });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'A payment for this month already exists.' });
      return;
    }
    console.error('Error creating payment:', error);
    serverError(res, error);
  }
};

export const getStudentPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (req.user?.role !== Role.STUDENT) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) {
      res.status(404).json({ error: 'Student profile not found' });
      return;
    }

    const payments = await prisma.payment.findMany({
      where: { studentId: student.id },
      include: {
        driver: {
          select: {
            fullName: true,
            busRegNumber: true,
            routeName: true
          }
        }
      },
      orderBy: { paymentDate: 'desc' }
    });

    res.status(200).json({ payments });
  } catch (error: any) {
    serverError(res, error);
  }
};

export const getDriverPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (req.user?.role !== Role.DRIVER) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const driver = await prisma.driver.findUnique({ where: { userId } });
    if (!driver) {
      res.status(404).json({ error: 'Driver profile not found' });
      return;
    }

    const payments = await prisma.payment.findMany({
      where: { driverId: driver.id },
      include: {
        student: {
          select: {
            fullName: true
          }
        }
      },
      orderBy: { paymentDate: 'desc' }
    });

    res.status(200).json({ payments });
  } catch (error: any) {
    serverError(res, error);
  }
};

export const getWalletBalance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (req.user?.role !== Role.DRIVER) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const driver = await prisma.driver.findUnique({
      where: { userId },
      select: { walletBalance: true }
    });

    if (!driver) {
      res.status(404).json({ error: 'Driver profile not found' });
      return;
    }

    res.status(200).json({ balance: driver.walletBalance });
  } catch (error: any) {
    serverError(res, error);
  }
};
