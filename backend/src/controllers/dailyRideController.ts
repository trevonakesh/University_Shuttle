import { Request, Response } from 'express';
import { TripType, RequestStatus, DriverStatus, FareStatus } from '@prisma/client';
import prisma from '../prismaClient';
import { getCommissionRate } from '../services/settingsService';
import { parseFee, lockStudentDriver } from '../services/fareService';
import { currentColomboDateString } from '../utils/time';
import { HttpError } from '../utils/httpError';
import { sendEmail, emails } from '../services/email';

const TRIP_TYPES = Object.values(TripType) as string[];
const DRIVER_DECISIONS: RequestStatus[] = [RequestStatus.APPROVED, RequestStatus.REJECTED];

const isValidDate = (date: unknown): date is string =>
  typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date));

// A daily ride is covered — and must not be charged again — when the student
// has already paid the monthly fare for the month that day falls in.
const monthIsPaid = async (db: { monthlyFare: typeof prisma.monthlyFare }, studentId: number, driverId: number, date: string) => {
  const fare = await db.monthlyFare.findUnique({
    where: { studentId_driverId_month: { studentId, driverId, month: date.slice(0, 7) } }
  });
  return fare?.status === FareStatus.PAID;
};

// Create a new daily ride request (Student)
export const createDailyRideRequest = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { driverId, date, tripType } = req.body; // tripType: "ROUND_TRIP" | "TO_UNI_ONLY" | "FROM_UNI_ONLY"

    if (!TRIP_TYPES.includes(tripType)) {
      return res.status(400).json({ message: `tripType must be one of: ${TRIP_TYPES.join(', ')}.` });
    }
    if (!isValidDate(date)) {
      return res.status(400).json({ message: 'date must be a valid date in YYYY-MM-DD format.' });
    }
    if (date < currentColomboDateString()) {
      return res.status(400).json({ message: 'You cannot request a ride for a date that has already passed.' });
    }

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
    if (driver.status !== DriverStatus.APPROVED) {
      return res.status(400).json({ message: 'This driver is not accepting rides yet.' });
    }

    // A ride is never free: refuse rather than record a request with no fare.
    const isRoundTrip = tripType === TripType.ROUND_TRIP;
    const fareAmount = parseFee(isRoundTrip ? driver.dailyFeeRoundTrip : driver.dailyFeeOneWay);
    if (fareAmount <= 0) {
      return res.status(400).json({
        message: `This driver hasn't set a daily fare for ${isRoundTrip ? 'round trips' : 'one-way trips'} yet.`
      });
    }

    if (await monthIsPaid(prisma, student.id, driver.id, date)) {
      return res.status(400).json({
        message: `You've already paid the monthly fare for ${date.slice(0, 7)}, so this day is already covered.`
      });
    }

    const newRequest = await prisma.dailyRideRequest.create({
      data: {
        studentId: student.id,
        driverId: driver.id,
        date,
        tripType: tripType as TripType,
        fareAmount
      }
    });

    res.status(201).json(newRequest);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'You already have a request for this date.' });
    }
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

// Update status (Driver accepts or rejects). The driver can change their mind
// until the student pays; after that the ride is settled and locked.
export const updateDailyRideStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const requestId = Number(req.params.id);
    const { status } = req.body; // "APPROVED" | "REJECTED"

    if (!DRIVER_DECISIONS.includes(status)) {
      return res.status(400).json({ message: 'status must be APPROVED or REJECTED.' });
    }

    const driver = await prisma.driver.findUnique({
      where: { userId }
    });

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found.' });
    }

    const { updated, previousStatus } = await prisma.$transaction(async (tx) => {
      const existingRequest = await tx.dailyRideRequest.findUnique({
        where: { id: requestId }
      });

      if (!existingRequest || existingRequest.driverId !== driver.id) {
        throw new HttpError(404, 'Request not found.');
      }

      // Same lock as payment, so a ride can't be rejected mid-payment.
      await lockStudentDriver(tx, existingRequest.studentId, driver.id);
      const current = await tx.dailyRideRequest.findUnique({ where: { id: requestId } });
      if (current?.paymentId) {
        throw new HttpError(400, 'This ride has already been paid for and can no longer be changed.');
      }

      const updated = await tx.dailyRideRequest.update({
        where: { id: requestId },
        data: { status: status as RequestStatus },
        include: { student: { select: { fullName: true, user: { select: { email: true } } } } }
      });
      return { updated, previousStatus: current?.status };
    });

    const { student, ...updatedRequest } = updated;
    if (previousStatus !== status) {
      const ride = {
        date: updatedRequest.date,
        tripType: updatedRequest.tripType,
        fareAmount: updatedRequest.fareAmount,
        driverName: driver.fullName
      };
      void sendEmail(status === RequestStatus.APPROVED
        ? emails.dailyRideApproved(student.user.email, student.fullName, ride)
        : emails.dailyRideRejected(student.user.email, student.fullName, ride));
    }

    // TODO: Create an in-app Notification for the student

    res.json(updatedRequest);
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error('Error updating daily ride status:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Student pays for an approved daily ride
export const payDailyRide = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const requestId = Number(req.params.id);

    const student = await prisma.student.findUnique({
      where: { userId },
      include: { user: { select: { email: true } } }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    const commissionRate = await getCommissionRate();

    // Create payment and update wallet. Every check runs under the
    // student/driver lock, so a double tap or a concurrent monthly payment
    // can't charge for the same ride twice.
    const payment = await prisma.$transaction(async (tx) => {
      const found = await tx.dailyRideRequest.findUnique({ where: { id: requestId } });
      if (!found || found.studentId !== student.id) {
        throw new HttpError(404, 'Request not found.');
      }

      await lockStudentDriver(tx, student.id, found.driverId);
      const existingRequest = await tx.dailyRideRequest.findUnique({
        where: { id: requestId },
        include: { driver: { select: { fullName: true } } }
      });
      if (!existingRequest) {
        throw new HttpError(404, 'Request not found.');
      }

      if (existingRequest.status !== RequestStatus.APPROVED) {
        throw new HttpError(400, 'Only approved rides can be paid.');
      }
      if (existingRequest.paymentId) {
        throw new HttpError(400, 'This ride is already paid.');
      }

      const amount = existingRequest.fareAmount ?? 0;
      if (amount <= 0) {
        throw new HttpError(400, 'This ride has no fare set, so it cannot be paid. Ask your driver to set a daily fare.');
      }
      if (await monthIsPaid(tx, student.id, existingRequest.driverId, existingRequest.date)) {
        throw new HttpError(400, `You've already paid the monthly fare for ${existingRequest.date.slice(0, 7)}, so this day is already covered.`);
      }

      const adminCommission = Math.round(amount * commissionRate * 100) / 100;

      const p = await tx.payment.create({
        data: {
          studentId: student.id,
          driverId: existingRequest.driverId,
          amount,
          adminCommission,
          paymentType: 'DAILY',
          billingPeriod: existingRequest.date,
          status: 'COMPLETED',
          paymentMethod: 'IN_APP',
          referenceNo: `APP-DAILY-${Date.now()}`
        }
      });

      await tx.dailyRideRequest.update({
        where: { id: existingRequest.id },
        data: { paymentId: p.id }
      });

      await tx.driver.update({
        where: { id: existingRequest.driverId },
        data: { walletBalance: { increment: amount - adminCommission } }
      });

      return { p, ride: existingRequest };
    });

    void sendEmail(emails.paymentReceipt(student.user.email, student.fullName, {
      description: emails.dailyRideLabel(payment.ride.date),
      amount: payment.p.amount,
      method: payment.p.paymentMethod,
      reference: payment.p.referenceNo,
      paidTo: payment.ride.driver.fullName
    }));

    res.json({ success: true, payment: payment.p });
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error('Error paying daily ride:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
