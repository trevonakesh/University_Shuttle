import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { AuthRequest } from '../middleware/authMiddleware';
import { RequestStatus, Role } from '@prisma/client';
import { parseFee } from '../services/fareService';
import { sendEmail, emails } from '../services/email';

export const createRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { driverId, paymentPlan } = req.body;
    const userId = req.user?.userId;

    if (!userId || req.user?.role !== Role.STUDENT) {
      res.status(403).json({ error: 'Only students can request a seat' });
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

    // Check if a request to THIS specific driver already exists (even if rejected/cancelled)
    const existingForThisDriver = await prisma.seatRequest.findUnique({
      where: {
        studentId_driverId: { studentId: student.id, driverId: driver.id }
      }
    });

    if (existingForThisDriver && (existingForThisDriver.status === RequestStatus.PENDING || existingForThisDriver.status === RequestStatus.APPROVED)) {
      res.status(400).json({ error: 'You have already sent a request to this bus' });
      return;
    }

    // Check if the student already has an active request with ANY driver
    const activeRequest = await prisma.seatRequest.findFirst({
      where: {
        studentId: student.id,
        status: { in: [RequestStatus.PENDING, RequestStatus.APPROVED] }
      }
    });

    if (activeRequest) {
      res.status(400).json({ error: 'You are already assigned to a driver or have a pending request. Please unassign first.' });
      return;
    }

    let seatRequest;
    if (existingForThisDriver) {
      seatRequest = await prisma.seatRequest.update({
        where: { id: existingForThisDriver.id },
        data: { status: RequestStatus.PENDING, paymentPlan: paymentPlan || 'MONTHLY' }
      });
    } else {
      seatRequest = await prisma.seatRequest.create({
        data: {
          studentId: student.id,
          driverId: driver.id,
          status: RequestStatus.PENDING,
          paymentPlan: paymentPlan || 'MONTHLY'
        }
      });
    }

    res.status(201).json({ message: 'Seat request sent successfully', seatRequest });
  } catch (error: any) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

export const getStudentRequests = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const requests = await prisma.seatRequest.findMany({
      where: { studentId: student.id },
      include: {
        driver: {
          select: {
            fullName: true,
            busRegNumber: true,
            routeName: true,
            destination: true,
            pickupTime: true,
            nic: true,
            profilePhotoUrl: true,
            busPhotoUrl: true,
            user: {
              select: {
                phone: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ requests });
  } catch (error: any) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

export const getDriverRequests = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const requests = await prisma.seatRequest.findMany({
      where: { driverId: driver.id },
      include: {
        student: {
          select: {
            fullName: true,
            studentId: true,
            universityName: true,
            pickupPoint: true,
            user: {
              select: {
                phone: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ requests });
  } catch (error: any) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

export const updateRequestStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.userId;

    if (req.user?.role !== Role.DRIVER) {
      res.status(403).json({ error: 'Access denied. Only drivers can update request status.' });
      return;
    }

    if (!Object.values(RequestStatus).includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const driver = await prisma.driver.findUnique({ where: { userId } });
    if (!driver) {
      res.status(404).json({ error: 'Driver profile not found' });
      return;
    }

    const seatRequest = await prisma.seatRequest.findUnique({ where: { id: parseInt(id as string) } });
    if (!seatRequest) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }

    if (seatRequest.driverId !== driver.id) {
      res.status(403).json({ error: 'You are not authorized to update this request' });
      return;
    }

    const updatedRequest = await prisma.seatRequest.update({
      where: { id: parseInt(id as string) },
      data: { status },
      include: { student: { select: { fullName: true, user: { select: { email: true } } } } }
    });

    if (seatRequest.status !== status && (status === RequestStatus.APPROVED || status === RequestStatus.REJECTED)) {
      const bus = {
        fullName: driver.fullName,
        busRegNumber: driver.busRegNumber,
        routeName: driver.routeName,
        pickupTime: driver.pickupTime,
        monthlyFee: parseFee(driver.monthlyFee)
      };
      const { fullName, user } = updatedRequest.student;
      void sendEmail(status === RequestStatus.APPROVED
        ? emails.seatApproved(user.email, fullName, bus)
        : emails.seatRejected(user.email, fullName, bus));
    }

    res.status(200).json({ message: `Request ${status.toLowerCase()} successfully`, request: updatedRequest });
  } catch (error: any) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

export const deleteRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (req.user?.role !== Role.STUDENT) {
      res.status(403).json({ error: 'Access denied. Only students can unassign themselves.' });
      return;
    }

    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) {
      res.status(404).json({ error: 'Student profile not found' });
      return;
    }

    const seatRequest = await prisma.seatRequest.findUnique({ where: { id: parseInt(id as string) } });
    if (!seatRequest) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }

    if (seatRequest.studentId !== student.id) {
      res.status(403).json({ error: 'You are not authorized to delete this request' });
      return;
    }

    await prisma.seatRequest.delete({
      where: { id: parseInt(id as string) }
    });

    res.status(200).json({ message: 'Request deleted and driver unassigned successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};
