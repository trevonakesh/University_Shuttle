import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { serverError } from '../utils/httpError';
import { AuthRequest } from '../middleware/authMiddleware';

export const getBuses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { destination, startingPoint, universityName } = req.query;

    const whereClause: any = { user: { deactivatedAt: null } }; // never list removed drivers

    if (req.user?.role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { userId: req.user.userId }
      });
      whereClause.status = 'APPROVED'; // Only show approved drivers
      if (student?.destination) {
        whereClause.OR = [
          { destination: { contains: student.destination, mode: 'insensitive' } },
          { routeName: { contains: student.destination, mode: 'insensitive' } }
        ];
      }
    } else {
      if (destination) {
        whereClause.destination = { contains: String(destination), mode: 'insensitive' };
      }
      if (startingPoint) {
        whereClause.startingPoint = { contains: String(startingPoint), mode: 'insensitive' };
      }
      if (universityName && !destination) {
         whereClause.destination = { contains: String(universityName), mode: 'insensitive' };
      }
    }

    const buses = await prisma.driver.findMany({
      where: whereClause,
      select: {
        id: true,
        fullName: true,
        busRegNumber: true,
        busCapacity: true,
        routeName: true,
        startingPoint: true,
        destination: true,
        monthlyFee: true,
        scheduleType: true,
        pickupTime: true,
        dropTime: true,
        profilePhotoUrl: true,
        busPhotoUrl: true
      }
    });

    res.status(200).json({ buses });
  } catch (error: any) {
    serverError(res, error);
  }
};

export const getBusById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const bus = await prisma.driver.findFirst({
      where: { id: parseInt(id as string), user: { deactivatedAt: null } },
      select: {
        id: true,
        fullName: true,
        busRegNumber: true,
        busCapacity: true,
        routeName: true,
        startingPoint: true,
        destination: true,
        monthlyFee: true,
        scheduleType: true,
        pickupTime: true,
        dropTime: true,
        profilePhotoUrl: true,
        busPhotoUrl: true
      }
    });

    if (!bus) {
      res.status(404).json({ error: 'Bus/Driver not found' });
      return;
    }

    res.status(200).json({ bus });
  } catch (error: any) {
    serverError(res, error);
  }
};
