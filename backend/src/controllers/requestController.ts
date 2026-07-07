import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { AuthRequest } from '../middleware/authMiddleware';
import { RequestStatus, Role } from '@prisma/client';

export const createRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { driverId } = req.body;
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

    if (existingForThisDriver && [RequestStatus.PENDING, RequestStatus.APPROVED].includes(existingForThisDriver.status)) {
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
        data: { status: RequestStatus.PENDING }
      });
    } else {
      seatRequest = await prisma.seatRequest.create({
        data: {
          studentId: student.id,
          driverId: driver.id,
          status: RequestStatus.PENDING
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

    const seatRequest = await prisma.seatRequest.findUnique({ where: { id: parseInt(id) } });
    if (!seatRequest) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }

    if (seatRequest.driverId !== driver.id) {
      res.status(403).json({ error: 'You are not authorized to update this request' });
      return;
    }

    const updatedRequest = await prisma.seatRequest.update({
      where: { id: parseInt(id) },
      data: { status }
    });

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

    const seatRequest = await prisma.seatRequest.findUnique({ where: { id: parseInt(id) } });
    if (!seatRequest) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }

    if (seatRequest.studentId !== student.id) {
      res.status(403).json({ error: 'You are not authorized to delete this request' });
      return;
    }

    await prisma.seatRequest.delete({
      where: { id: parseInt(id) }
    });

    res.status(200).json({ message: 'Request deleted and driver unassigned successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};
