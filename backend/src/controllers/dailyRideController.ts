import { Request, Response } from 'express';
import { PrismaClient, TripType, RequestStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Create a new daily ride request (Student)
export const createDailyRideRequest = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { driverId, date, tripType } = req.body; // tripType: "ROUND_TRIP" | "TO_UNI_ONLY" | "FROM_UNI_ONLY"

    // Find student
    const student = await prisma.student.findUnique({
      where: { userId }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    // Check if request already exists for this date and driver
    const existingReq = await prisma.dailyRideRequest.findUnique({
      where: {
        studentId_driverId_date: {
          studentId: student.id,
          driverId: Number(driverId),
          date
        }
      }
    });

    if (existingReq) {
      return res.status(400).json({ message: 'You already have a request for this date.' });
    }

    // Fetch driver to get rates
    const driver = await prisma.driver.findUnique({
      where: { id: Number(driverId) }
    });

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found.' });
    }

    // Calculate fare based on trip type
    let fareAmount = 0;
    if (tripType === 'ROUND_TRIP' && driver.dailyFeeRoundTrip) {
      fareAmount = parseFloat(driver.dailyFeeRoundTrip);
    } else if (tripType !== 'ROUND_TRIP' && driver.dailyFeeOneWay) {
      fareAmount = parseFloat(driver.dailyFeeOneWay);
    }

    const newRequest = await prisma.dailyRideRequest.create({
      data: {
        studentId: student.id,
        driverId: Number(driverId),
        date,
        tripType: tripType as TripType,
        fareAmount: fareAmount > 0 ? fareAmount : null
      }
    });

    res.status(201).json(newRequest);
  } catch (error) {
    console.error('Error creating daily ride request:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get requests for a student
export const getStudentDailyRequests = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const student = await prisma.student.findUnique({
      where: { userId }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    const requests = await prisma.dailyRideRequest.findMany({
      where: { studentId: student.id },
      include: { driver: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching student daily requests:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get requests for a driver (usually to see pending ones)
export const getDriverDailyRequests = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { date } = req.query; // optional filter

    const driver = await prisma.driver.findUnique({
      where: { userId }
    });

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found.' });
    }

    const filter: any = { driverId: driver.id };
    if (date) {
      filter.date = String(date);
    }

    const requests = await prisma.dailyRideRequest.findMany({
      where: filter,
      include: { student: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching driver daily requests:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Update status (Driver accepts or rejects)
export const updateDailyRideStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const requestId = Number(req.params.id);
    const { status } = req.body; // "APPROVED" | "REJECTED"

    const driver = await prisma.driver.findUnique({
      where: { userId }
    });

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found.' });
    }

    const existingRequest = await prisma.dailyRideRequest.findUnique({
      where: { id: requestId }
    });

    if (!existingRequest || existingRequest.driverId !== driver.id) {
      return res.status(404).json({ message: 'Request not found.' });
    }

    const updatedRequest = await prisma.dailyRideRequest.update({
      where: { id: requestId },
      data: { status: status as RequestStatus }
    });

    // TODO: Create a Notification for the student

    res.json(updatedRequest);
  } catch (error) {
    console.error('Error updating daily ride status:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
