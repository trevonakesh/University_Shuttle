import { Response } from 'express';
import prisma from '../prismaClient';
import { AuthRequest } from '../middleware/authMiddleware';
import { Role, PayoutRequestStatus } from '@prisma/client';
import { createNotification } from '../services/fareService';
import { sendEmail, emails } from '../services/email';

// ---------- DRIVER SIDE ----------

// POST /api/payout-requests  { amount, note? }
// Driver asks to withdraw part (or all) of their wallet balance.
// The wallet is NOT touched here — only when an admin approves.
export const createPayoutRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== Role.DRIVER) {
      res.status(403).json({ error: 'Only drivers can request a payout' });
      return;
    }

    const driver = await prisma.driver.findUnique({
      where: { userId: req.user.userId },
      include: { user: { select: { email: true } } }
    });
    if (!driver) {
      res.status(404).json({ error: 'Driver profile not found' });
      return;
    }

    const amount = Number(req.body?.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      res.status(400).json({ error: 'Enter a valid amount greater than zero.' });
      return;
    }
    if (amount > driver.walletBalance + 0.001) {
      res.status(400).json({
        error: `You can request at most LKR ${driver.walletBalance.toFixed(2)} — that is your current wallet balance.`
      });
      return;
    }

    // One open request at a time, so the same balance can't be claimed twice.
    const pending = await prisma.payoutRequest.findFirst({
      where: { driverId: driver.id, status: PayoutRequestStatus.PENDING }
    });
    if (pending) {
      res.status(400).json({
        error: `You already have a pending request for LKR ${pending.amount.toFixed(2)}. Wait for the admin to review it.`
      });
      return;
    }

    const request = await prisma.payoutRequest.create({
      data: {
        driverId: driver.id,
        amount,
        note: req.body?.note ? String(req.body.note) : null
      }
    });

    // Let every admin know there's something to review.
    const admins = await prisma.user.findMany({ where: { role: Role.ADMIN }, select: { id: true, email: true } });
    await Promise.all(admins.map(a => createNotification(
      a.id,
      'Payout Requested',
      `${driver.fullName} requested a payout of LKR ${amount.toFixed(2)}.`
    )));
    for (const a of admins) {
      void sendEmail(emails.payoutRequestedAdmin(a.email, driver.fullName, driver.busRegNumber, amount));
    }
    void sendEmail(emails.payoutRequestedDriver(driver.user.email, driver.fullName, amount));

    res.status(201).json({ message: 'Payout request submitted', request });
  } catch (error: any) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// GET /api/payout-requests/mine — the driver's own request history.
export const getMyPayoutRequests = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const requests = await prisma.payoutRequest.findMany({
      where: { driverId: driver.id },
      include: { payout: { select: { method: true, referenceNo: true, createdAt: true } } },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ walletBalance: driver.walletBalance, requests });
  } catch (error: any) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// DELETE /api/payout-requests/:id — driver cancels their own pending request.
export const cancelPayoutRequest = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const request = await prisma.payoutRequest.findUnique({ where: { id: parseInt(String(req.params.id)) } });
    if (!request || request.driverId !== driver.id) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }
    if (request.status !== PayoutRequestStatus.PENDING) {
      res.status(400).json({ error: 'Only a pending request can be cancelled.' });
      return;
    }

    await prisma.payoutRequest.delete({ where: { id: request.id } });
    res.status(200).json({ message: 'Request cancelled' });
  } catch (error: any) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// ---------- ADMIN SIDE ----------

// GET /api/admin/payout-requests?status=PENDING
export const getPayoutRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const status = String(req.query.status || '').toUpperCase();
    const where = Object.values(PayoutRequestStatus).includes(status as PayoutRequestStatus)
      ? { status: status as PayoutRequestStatus }
      : {};

    const requests = await prisma.payoutRequest.findMany({
      where,
      include: {
        driver: {
          select: {
            id: true, fullName: true, busRegNumber: true, walletBalance: true,
            bankName: true, accNumber: true, accHolder: true,
            user: { select: { email: true, phone: true } }
          }
        },
        payout: { select: { method: true, referenceNo: true, createdAt: true } }
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }]
    });

    res.status(200).json(requests);
  } catch (error: any) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// PATCH /api/admin/payout-requests/:id  { action: 'APPROVE'|'REJECT', method?, referenceNo?, adminNote? }
// Approving pays the driver: creates a Payout and decrements the wallet in one
// transaction. Rejecting leaves the balance untouched.
export const reviewPayoutRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(String(req.params.id));
    const action = String(req.body?.action || '').toUpperCase();
    if (!['APPROVE', 'REJECT'].includes(action)) {
      res.status(400).json({ error: "action must be 'APPROVE' or 'REJECT'" });
      return;
    }

    const request = await prisma.payoutRequest.findUnique({
      where: { id },
      include: { driver: { include: { user: { select: { id: true, email: true } } } } }
    });
    if (!request) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }
    if (request.status !== PayoutRequestStatus.PENDING) {
      res.status(400).json({ error: `This request was already ${request.status.toLowerCase()}.` });
      return;
    }

    const adminNote = req.body?.adminNote ? String(req.body.adminNote) : null;

    if (action === 'REJECT') {
      const updated = await prisma.payoutRequest.update({
        where: { id },
        data: { status: PayoutRequestStatus.REJECTED, adminNote, reviewedAt: new Date() }
      });
      await createNotification(
        request.driver.user.id,
        'Payout Request Rejected',
        `Your payout request for LKR ${request.amount.toFixed(2)} was rejected.${adminNote ? ` Reason: ${adminNote}` : ''}`
      );
      void sendEmail(emails.payoutRejected(request.driver.user.email, request.driver.fullName, request.amount, adminNote));
      res.status(200).json({ message: 'Request rejected', request: updated });
      return;
    }

    // Re-check the balance at approval time — it may have changed since the
    // request was made (e.g. cash commissions debited it).
    if (request.amount > request.driver.walletBalance + 0.001) {
      res.status(400).json({
        error: `Driver's wallet balance is now LKR ${request.driver.walletBalance.toFixed(2)}, which is less than the requested LKR ${request.amount.toFixed(2)}. Ask them to submit a new request.`
      });
      return;
    }

    const allowed = ['BANK_TRANSFER', 'CASH'];
    const method = allowed.includes(String(req.body?.method)) ? String(req.body.method) : 'BANK_TRANSFER';
    const referenceNo = req.body?.referenceNo ? String(req.body.referenceNo) : null;

    const result = await prisma.$transaction(async (tx) => {
      const payout = await tx.payout.create({
        data: {
          driverId: request.driverId,
          amount: request.amount,
          method,
          referenceNo,
          note: adminNote ?? request.note
        }
      });
      const driver = await tx.driver.update({
        where: { id: request.driverId },
        data: { walletBalance: { decrement: request.amount } }
      });
      const updated = await tx.payoutRequest.update({
        where: { id },
        data: {
          status: PayoutRequestStatus.APPROVED,
          adminNote,
          payoutId: payout.id,
          reviewedAt: new Date()
        }
      });
      return { payout, driver, updated };
    });

    await createNotification(
      request.driver.user.id,
      'Payout Approved',
      `Your payout of LKR ${request.amount.toFixed(2)} was approved and paid via ${method.replace('_', ' ').toLowerCase()}${referenceNo ? ` (ref: ${referenceNo})` : ''}. Remaining wallet balance: LKR ${result.driver.walletBalance.toFixed(2)}.`
    );

    void sendEmail(emails.payoutSent(
      request.driver.user.email, request.driver.fullName, request.amount, method, referenceNo, result.driver.walletBalance
    ));

    res.status(200).json({
      message: 'Request approved and paid',
      request: result.updated,
      payout: result.payout,
      walletBalance: result.driver.walletBalance
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};
