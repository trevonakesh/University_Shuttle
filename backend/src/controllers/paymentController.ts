import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { AuthRequest } from '../middleware/authMiddleware';
import { Role, PaymentStatus } from '@prisma/client';

export const createPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { driverId, amount, month, paymentMethod, referenceNo } = req.body;
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

    const driver = await prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) {
      res.status(404).json({ error: 'Driver/Bus not found' });
      return;
    }

    // Use a transaction to both record the payment and update the driver's wallet
    const [payment] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          studentId: student.id,
          driverId: driver.id,
          amount,
          month,
          status: PaymentStatus.COMPLETED,
          paymentMethod: paymentMethod || 'IN_APP',
          referenceNo
        }
      }),
      prisma.driver.update({
        where: { id: driver.id },
        data: {
          walletBalance: {
            increment: amount
          }
        }
      })
    ]);

    res.status(201).json({ message: 'Payment recorded successfully', payment });
  } catch (error: any) {
    res.status(500).json({ error: 'Server error', details: error.message });
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
