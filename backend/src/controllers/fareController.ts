import { Response } from 'express';
import prisma from '../prismaClient';
import { AuthRequest } from '../middleware/authMiddleware';
import { FareStatus, RequestStatus, Role, PaymentStatus } from '@prisma/client';
import { FREEZE_DAY, currentDay, currentMonth, isValidMonth } from '../utils/time';
import { parseFee, isInGracePeriod, checkFrozen, createNotification } from '../services/fareService';
import { emitFareUpdated } from '../socketHandler';

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

    res.status(200).json({ month, fee, dueDay: FREEZE_DAY, summary, students });
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
      include: { student: { include: { user: { select: { id: true } } } } }
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
    const existing = await prisma.monthlyFare.findUnique({
      where: fareKey,
      include: { payment: true }
    });

    if (existing?.status === status) {
      res.status(400).json({ error: `Already marked as ${status}` });
      return;
    }

    let fare;

    if (status === FareStatus.PAID) {
      // Cash collected in person. The driver already holds the full amount,
      // so the platform's 10% commission is deducted from their wallet
      // (PickMe/Uber style — the balance may go negative until settled).
      const commission = Math.round(fee * 0.10 * 100) / 100;
      fare = await prisma.$transaction(async (tx) => {
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
      });
      await createNotification(
        assignment.student.user.id,
        'Payment Recorded',
        `Your driver marked your ${month} fare (LKR ${fee.toFixed(2)}) as paid in cash.`
      );
    } else if (status === FareStatus.EXEMPT) {
      if (existing?.status === FareStatus.PAID) {
        res.status(400).json({ error: 'Student already paid this month. Undo the payment first.' });
        return;
      }
      fare = await prisma.monthlyFare.upsert({
        where: fareKey,
        create: { studentId, driverId: driver.id, month, status: FareStatus.EXEMPT, amount: fee, markedBy: 'DRIVER' },
        update: { status: FareStatus.EXEMPT, markedBy: 'DRIVER', paymentId: null }
      });
      await createNotification(
        assignment.student.user.id,
        'Marked As Not Travelling',
        `Your driver marked you as not travelling for ${month}. Your account is frozen for this month and unfreezes automatically next month — or pay the monthly fare if you plan to travel.`
      );
    } else {
      // Undo back to UNPAID. In-app payments cannot be undone by the driver.
      if (existing?.payment?.paymentMethod === 'IN_APP') {
        res.status(400).json({ error: 'This month was paid through the app and cannot be undone.' });
        return;
      }
      const ops: any[] = [];
      if (existing?.paymentId) {
        // Undoing a cash payment also refunds the commission that was
        // deducted from the wallet when it was recorded.
        if ((existing.payment?.adminCommission ?? 0) > 0) {
          ops.push(prisma.driver.update({
            where: { id: driver.id },
            data: { walletBalance: { increment: existing.payment!.adminCommission } }
          }));
        }
        ops.push(prisma.payment.delete({ where: { id: existing.paymentId } }));
      }
      ops.push(
        prisma.monthlyFare.upsert({
          where: fareKey,
          create: { studentId, driverId: driver.id, month, status: FareStatus.UNPAID, amount: fee, markedBy: 'DRIVER' },
          update: { status: FareStatus.UNPAID, markedBy: 'DRIVER', paymentId: null }
        })
      );
      const results = await prisma.$transaction(ops);
      fare = results[results.length - 1];
    }

    emitFareUpdated(driver.id, { studentId, month, status });

    res.status(200).json({ message: `Marked as ${status}`, fare });
  } catch (error: any) {
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
