import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { DriverStatus } from '@prisma/client';
import { emitDriverStatusUpdated } from '../socketHandler';

export const getDrivers = async (req: Request, res: Response) => {
  try {
    const drivers = await prisma.driver.findMany({
      include: {
        user: {
          select: { email: true, phone: true }
        }
      },
      orderBy: { id: 'desc' }
    });
    res.status(200).json(drivers);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateDriverStatus = async (req: Request, res: Response) => {
  try {
    const driverId = parseInt(req.params.id);
    const { status } = req.body;

    if (!Object.values(DriverStatus).includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const driver = await prisma.driver.update({
      where: { id: driverId },
      data: { status }
    });

    // Notify driver about status change
    emitDriverStatusUpdated(driverId, status);

    res.status(200).json(driver);
  } catch (error) {
    console.error('Error updating driver status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getStudentsByDriver = async (req: Request, res: Response) => {
  try {
    const driverId = parseInt(req.params.id);
    
    // Find students whose seat requests are APPROVED for this driver
    const seatRequests = await prisma.seatRequest.findMany({
      where: {
        driverId,
        status: 'APPROVED'
      },
      include: {
        student: {
          include: {
            user: { select: { email: true, phone: true } }
          }
        }
      }
    });

    const students = seatRequests.map(req => req.student);
    res.status(200).json(students);
  } catch (error) {
    console.error('Error fetching students by driver:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPayments = async (req: Request, res: Response) => {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        student: {
          select: { fullName: true, studentId: true }
        },
        driver: {
          select: { fullName: true, busRegNumber: true }
        }
      },
      orderBy: { paymentDate: 'desc' }
    });
    res.status(200).json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
