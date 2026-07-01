import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { AuthRequest } from '../middleware/authMiddleware';

export const getBuses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { destination, startingPoint, universityName } = req.query;

    // We consider 'Driver' as the entity holding bus information
    // Build a flexible where clause based on query params
    const whereClause: any = {};
    if (destination) {
      whereClause.destination = { contains: String(destination), mode: 'insensitive' };
    }
    if (startingPoint) {
      whereClause.startingPoint = { contains: String(startingPoint), mode: 'insensitive' };
    }
    // If universityName is passed, it typically matches the destination for most routes
    if (universityName && !destination) {
       whereClause.destination = { contains: String(universityName), mode: 'insensitive' };
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
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

export const getBusById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const bus = await prisma.driver.findUnique({
      where: { id: parseInt(id) },
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
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};
