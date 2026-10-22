import { Response } from 'express';
import prisma from '../prismaClient';
import { AuthRequest } from '../middleware/authMiddleware';
import { FareStatus, RequestStatus, Role, PaymentStatus } from '@prisma/client';
import { FREEZE_DAY, currentDay, currentMonth, isValidMonth } from '../utils/time';
import { parseFee, isInGracePeriod, checkFrozen, createNotification, lockStudentDriver } from '../services/fareService';
import { getCommissionRate } from '../services/settingsService';
import { emitFareUpdated } from '../socketHandler';
import { HttpError } from '../utils/httpError';
import { sendEmail, emails } from '../services/email';

// A card checkout younger than this is treated as still in progress, so cash
// can't be recorded on top of it. The checkout link itself expires after 20
// minutes; the extra time covers a student still on PayHere's card page.
const CARD_CHECKOUT_WINDOW_MS = 30 * 60 * 1000;

// GET /api/fares/driver?month=YYYY-MM
// The driver's fare ledger for a month: every approved student with their
// status (UNPAID by default), plus collection totals.
export const getDriverFares = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== Role.DRIVER) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const driver = await prisma.driver.findUnique({ where: { userId: req.user.userId } });
    if (!driver) {
      res.status(404).json({ error: 'Driver profile not found' });
      return;
    }

    const month = isValidMonth(req.query.month) ? req.query.month : currentMonth();
    const fee = parseFee(driver.monthlyFee);
    const isCurrentMonth = month === currentMonth();
    const pastDueDay = currentDay() > FREEZE_DAY;

    const assignments = await prisma.seatRequest.findMany({
      where: { driverId: driver.id, status: RequestStatus.APPROVED },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            pickupPoint: true,
            profilePhotoUrl: true,
            user: { select: { phone: true } }
          }
        }
      },
      orderBy: { updatedAt: 'asc' }
    });

    const fares = await prisma.monthlyFare.findMany({
      where: { driverId: driver.id, month },
      include: { payment: { select: { paymentMethod: true, paymentDate: true } } }
    });
    const fareByStudent = new Map(fares.map(f => [f.studentId, f]));

    const students = assignments.map(a => {
      const fare = fareByStudent.get(a.studentId);
      const status = fare?.status ?? FareStatus.UNPAID;
      // Frozen this month if unpaid past the 10th (grace applies) or marked
      // as not travelling ("didn't come" freezes that month's account).
      const frozen = isCurrentMonth && (
        status === FareStatus.EXEMPT ||
        (status === FareStatus.UNPAID && pastDueDay && !isInGracePeriod(a.updatedAt))
      );
      return {
        studentId: a.studentId,
        fullName: a.student.fullName,
        pickupPoint: a.student.pickupPoint,
        phone: a.student.user?.phone ?? null,
        profilePhotoUrl: a.student.profilePhotoUrl,
        status,
        markedBy: fare?.markedBy ?? null,
        paymentMethod: fare?.payment?.paymentMethod ?? null,
        paidAt: fare?.payment?.paymentDate ?? null,
        amount: fare?.amount ?? fee,
        frozen
      };
    });

    const paid = students.filter(s => s.status === FareStatus.PAID);
    const exempt = students.filter(s => s.status === FareStatus.EXEMPT);
    const summary = {
      total: students.length,
      paid: paid.length,
      unpaid: students.length - paid.length - exempt.length,
      exempt: exempt.length,
      expected: (students.length - exempt.length) * fee,
      collected: paid.reduce((sum, s) => sum + s.amount, 0)
    };

    // commissionRate lets the apps quote the real platform fee when the
    // driver records a cash payment.
    const commissionRate = await getCommissionRate();
    res.status(200).json({ month, fee, dueDay: FREEZE_DAY, commissionRate, summary, students });
  } catch (error: any) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// PATCH /api/fares/:studentId  body: { month, status }
// Driver marks a student PAID (cash), EXEMPT (didn't come), or back to UNPAID.
export const setFareStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== Role.DRIVER) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const driver = await prisma.driver.findUnique({
      where: { userId: req.user.userId },
      include: { user: { select: { id: true } } }
    });
    if (!driver) {
      res.status(404).json({ error: 'Driver profile not found' });
      return;
    }

    const studentId = parseInt(String(req.params.studentId));
    const { month, status } = req.body;

    if (!Number.isInteger(studentId)) {
      res.status(400).json({ error: 'Invalid student id' });
      return;
    }
    if (!isValidMonth(month)) {
      res.status(400).json({ error: 'Invalid month, expected YYYY-MM' });
      return;
    }
    if (!Object.values(FareStatus).includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const assignment = await prisma.seatRequest.findUnique({
      where: { studentId_driverId: { studentId, driverId: driver.id } },
      include: { student: { include: { user: { select: { id: true, email: true } } } } }
    });
    if (!assignment || assignment.status !== RequestStatus.APPROVED) {
      res.status(403).json({ error: 'This student is not assigned to your bus' });
      return;
    }

    const fee = parseFee(driver.monthlyFee);
    if (status === FareStatus.PAID && fee <= 0) {
      res.status(400).json({ error: 'Set a valid monthly fee on your profile before recording payments.' });
      return;
    }

    const fareKey = { studentId_driverId_month: { studentId, driverId: driver.id, month } };
    const commissionRate = await getCommissionRate();

    // Every branch runs under the student/driver lock and re-reads the fare
    // inside it, so a card payment completing at the same moment can't be
    // overwritten or settled twice.
    const fare = await prisma.$transaction(async (tx) => {
      await lockStudentDriver(tx, studentId, driver.id);
      const existing = await tx.monthlyFare.findUnique({
        where: fareKey,
        include: { payment: true }
      });

      if (existing?.status === status) {
        throw new HttpError(400, `Already marked as ${status}`);
      }

      if (status === FareStatus.PAID) {
        // Cash collected in person. The driver already holds the full amount,
        // so the platform's commission is deducted from their wallet
        // (PickMe/Uber style — the balance may go negative until settled).
        const open = await tx.payment.findMany({
          where: {
            studentId,
            driverId: driver.id,
            month,
            status: { in: [PaymentStatus.COMPLETED, PaymentStatus.PENDING] }
          }
        });
        if (open.some(p => p.status === PaymentStatus.COMPLETED)) {
          throw new HttpError(409, `This student has already paid for ${month}.`);
        }
        const checkoutCutoff = Date.now() - CARD_CHECKOUT_WINDOW_MS;
        if (open.some(p => p.status === PaymentStatus.PENDING && p.paymentDate.getTime() > checkoutCutoff)) {
          throw new HttpError(409, `This student has a card payment in progress for ${month}. Try again in a few minutes.`);
        }
        // Older checkouts were abandoned. Closing them means a late gateway
        // confirmation is recorded as a duplicate instead of settling the month again.
        await tx.payment.updateMany({
          where: { studentId, driverId: driver.id, month, status: PaymentStatus.PENDING },
          data: { status: PaymentStatus.FAILED }
        });

        const commission = Math.round(fee * commissionRate * 100) / 100;
        const payment = await tx.payment.create({
          data: {
            studentId,
            driverId: driver.id,
            amount: fee,
            adminCommission: commission,
            month,
            status: PaymentStatus.COMPLETED,
            paymentMethod: 'CASH',
            referenceNo: `CASH-${Date.now()}`
          }
        });
        await tx.driver.update({
          where: { id: driver.id },
          data: { walletBalance: { decrement: commission } }
        });
        return tx.monthlyFare.upsert({
          where: fareKey,
          create: { studentId, driverId: driver.id, month, status: FareStatus.PAID, amount: fee, markedBy: 'DRIVER', paymentId: payment.id },
          update: { status: FareStatus.PAID, amount: fee, markedBy: 'DRIVER', paymentId: payment.id }
        });
      }

      if (status === FareStatus.EXEMPT) {
        if (existing?.status === FareStatus.PAID) {
          throw new HttpError(400, 'Student already paid this month. Undo the payment first.');
        }
        return tx.monthlyFare.upsert({
          where: fareKey,
          create: { studentId, driverId: driver.id, month, status: FareStatus.EXEMPT, amount: fee, markedBy: 'DRIVER' },
          update: { status: FareStatus.EXEMPT, markedBy: 'DRIVER', paymentId: null }
        });
      }

      // Undo back to UNPAID. Only cash can be undone: app and card payments
      // were made by the student and must stay on record.
      if (existing?.payment && existing.payment.paymentMethod !== 'CASH') {
        throw new HttpError(400, 'This month was paid through the app and cannot be undone.');
      }
      if (existing?.paymentId) {
        // Undoing a cash payment also refunds the commission that was
        // deducted from the wallet when it was recorded.
        if ((existing.payment?.adminCommission ?? 0) > 0) {
          await tx.driver.update({
            where: { id: driver.id },
            data: { walletBalance: { increment: existing.payment!.adminCommission } }
          });
        }
        await tx.payment.delete({ where: { id: existing.paymentId } });
      }
      return tx.monthlyFare.upsert({
        where: fareKey,
        create: { studentId, driverId: driver.id, month, status: FareStatus.UNPAID, amount: fee, markedBy: 'DRIVER' },
        update: { status: FareStatus.UNPAID, markedBy: 'DRIVER', paymentId: null }
      });
    });

    const studentEmail = assignment.student.user.email;
    const studentName = assignment.student.fullName;
    if (status === FareStatus.PAID) {
      await createNotification(
        assignment.student.user.id,
        'Payment Recorded',
        `Your driver marked your ${month} fare (LKR ${fee.toFixed(2)}) as paid in cash.`
      );
      void sendEmail(emails.cashRecorded(studentEmail, studentName, month, fee, driver.fullName));
    } else if (status === FareStatus.EXEMPT) {
      await createNotification(
        assignment.student.user.id,
        'Marked As Not Travelling',
        `Your driver marked you as not travelling for ${month}. Your account is frozen for this month and unfreezes automatically next month — or pay the monthly fare if you plan to travel.`
      );
      void sendEmail(emails.markedNotTravelling(studentEmail, studentName, month, fee, driver.fullName));
    }

    emitFareUpdated(driver.id, { studentId, month, status });

    res.status(200).json({ message: `Marked as ${status}`, fare });
  } catch (error: any) {
    if (error instanceof HttpError) {
      res.status(error.status).json({ error: error.message });
      return;
    }
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'A payment for this month already exists' });
      return;
    }
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// GET /api/fares/me — student's current-month fare status + frozen flag.
export const getMyFare = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== Role.STUDENT) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const student = await prisma.student.findUnique({ where: { userId: req.user.userId } });
    if (!student) {
      res.status(404).json({ error: 'Student profile not found' });
      return;
    }

    const check = await checkFrozen(student.id);

    res.status(200).json({
      assigned: check.driverId !== null,
      driverId: check.driverId,
      driverName: check.driverName,
      month: check.month,
      status: check.status,
      amountDue: check.amountDue,
      dueDay: FREEZE_DAY,
      frozen: check.frozen,
      freezeReason: check.reason
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};
