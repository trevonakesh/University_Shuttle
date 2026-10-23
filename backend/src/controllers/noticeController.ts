import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { serverError } from '../utils/httpError';
import { AuthRequest } from '../middleware/authMiddleware';
import { Role } from '@prisma/client';

export const createNotice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, content } = req.body;
    const userId = req.user?.userId;

    if (req.user?.role !== Role.DRIVER) {
      res.status(403).json({ error: 'Only drivers can post notices' });
      return;
    }

    const driver = await prisma.driver.findUnique({ where: { userId } });
    if (!driver) {
      res.status(404).json({ error: 'Driver profile not found' });
      return;
    }

    const notice = await prisma.notice.create({
      data: {
        driverId: driver.id,
        title,
        content
      }
    });

    res.status(201).json({ message: 'Notice created successfully', notice });
  } catch (error: any) {
    serverError(res, error);
  }
};

export const getDriverNotices = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const notices = await prisma.notice.findMany({
      where: { driverId: driver.id },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ notices });
  } catch (error: any) {
    serverError(res, error);
  }
};

export const getStudentNotices = async (req: AuthRequest, res: Response): Promise<void> => {
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

    // Get notices from drivers that the student has approved seat requests with
    const approvedRequests = await prisma.seatRequest.findMany({
      where: { 
        studentId: student.id,
        status: 'APPROVED'
      },
      select: { driverId: true }
    });

    const driverIds = approvedRequests.map(req => req.driverId);

    if (driverIds.length === 0) {
      res.status(200).json({ notices: [] });
      return;
    }

    const notices = await prisma.notice.findMany({
      where: { driverId: { in: driverIds } },
      include: {
        driver: {
          select: {
            fullName: true,
            busRegNumber: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ notices });
  } catch (error: any) {
    serverError(res, error);
  }
};

export const deleteNotice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (req.user?.role !== Role.DRIVER) {
      res.status(403).json({ error: 'Only drivers can delete notices' });
      return;
    }

    const driver = await prisma.driver.findUnique({ where: { userId } });
    if (!driver) {
      res.status(404).json({ error: 'Driver profile not found' });
      return;
    }

    const notice = await prisma.notice.findUnique({ where: { id: parseInt(id as string) } });
    if (!notice) {
      res.status(404).json({ error: 'Notice not found' });
      return;
    }

    if (notice.driverId !== driver.id) {
      res.status(403).json({ error: 'You can only delete your own notices' });
      return;
    }

    await prisma.notice.delete({ where: { id: parseInt(id as string) } });

    res.status(200).json({ message: 'Notice deleted successfully' });
  } catch (error: any) {
    serverError(res, error);
  }
};
