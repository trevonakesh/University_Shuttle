import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { AuthRequest } from '../middleware/authMiddleware';
import { Role, PaymentStatus, FareStatus, RequestStatus } from '@prisma/client';
import { currentMonth } from '../utils/time';
import { parseFee, createNotification } from '../services/fareService';
import { emitFareUpdated } from '../socketHandler';

export const createPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { referenceNo } = req.body;
    const userId = req.user?.userId;

    if (req.user?.role !== Role.STUDENT) {
      res.status(403).json({ error: 'Only students can make a payment' });
      return;
    }

    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) {
      res.status(404).json({ error: 'Student profile not found' });
      return;
    }

    // The server decides who gets paid, how much, and for which month:
    // the student's approved driver, that driver's monthly fee, the current
    // Colombo month. Client-supplied values are ignored.
    const assignment = await prisma.seatRequest.findFirst({
      where: { studentId: student.id, status: RequestStatus.APPROVED },
      include: { driver: { include: { user: { select: { id: true } } } } }
    });
    if (!assignment) {
      res.status(400).json({ error: 'You need an approved bus assignment before you can pay.' });
      return;
    }

    const driver = assignment.driver;
    const month = currentMonth();
    const numAmount = parseFee(driver.monthlyFee);
    if (numAmount <= 0) {
      res.status(400).json({ error: 'This driver has not set a valid monthly fee yet.' });
      return;
    }

    const fareKey = {
      studentId_driverId_month: { studentId: student.id, driverId: driver.id, month }
    };
    const existingFare = await prisma.monthlyFare.findUnique({ where: fareKey });
    if (existingFare?.status === FareStatus.PAID) {
      res.status(400).json({ error: `You have already paid for ${month}.` });
      return;
    }

    const adminCommission = numAmount * 0.10;
    const driverAmount = numAmount - adminCommission;

    // Record the payment, credit the wallet, and settle the month's fare
    // in one transaction.
    const payment = await prisma.$transaction(async (tx) => {
      const created = await tx.payment.create({
        data: {
          studentId: student.id,
          driverId: driver.id,
          amount: numAmount,
          adminCommission,
          month,
          status: PaymentStatus.COMPLETED,
          paymentMethod: 'IN_APP',
          referenceNo
        }
      });
      await tx.driver.update({
        where: { id: driver.id },
        data: { walletBalance: { increment: driverAmount } }
      });
      await tx.monthlyFare.upsert({
        where: fareKey,
        create: {
          studentId: student.id,
          driverId: driver.id,
          month,
          status: FareStatus.PAID,
          amount: numAmount,
          markedBy: 'STUDENT_APP',
          paymentId: created.id
        },
        update: {
          status: FareStatus.PAID,
          amount: numAmount,
          markedBy: 'STUDENT_APP',
          paymentId: created.id
        }
      });
      return created;
    });

    await createNotification(
      driver.user.id,
      'Fare Payment Received',
      `${student.fullName} paid the ${month} fare (LKR ${numAmount.toFixed(2)}) through the app.`
    );
    emitFareUpdated(driver.id, { studentId: student.id, month, status: FareStatus.PAID });

    res.status(201).json({ message: 'Payment recorded successfully', payment });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'A payment for this month already exists.' });
      return;
    }
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Server error', details: error.message || error.toString() });
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
    res.status(500).json({ error: 'Server error', details: error.message });
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
    res.status(500).json({ error: 'Server error', details: error.message });
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
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};
