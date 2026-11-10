import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { serverError } from '../utils/httpError';
import { AuthRequest } from '../middleware/authMiddleware';
import { DriverStatus, RequestStatus, Role } from '@prisma/client';
import { createNotification, parseFee } from '../services/fareService';
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

    const driver = await prisma.driver.findUnique({
      where: { id: Number(driverId) },
      include: { user: { select: { deactivatedAt: true } } }
    });
    if (!driver || driver.user.deactivatedAt) {
      res.status(404).json({ error: 'Driver/Bus not found' });
      return;
    }
    if (driver.status !== DriverStatus.APPROVED) {
      res.status(400).json({ error: 'This bus is not accepting passengers yet.' });
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
    serverError(res, error);
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
    serverError(res, error);
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
    serverError(res, error);
  }
};

// What a driver may change for a student on their bus. Name, NIC, university
// and sign-in details stay with the student and the admin.
const PASSENGER_FIELDS = {
  pickupPoint: 'Pickup point',
  homeLocation: 'Home location',
  emerContactName: 'Emergency contact name',
  emerContactPhone: 'Emergency contact phone',
  emerRelationship: 'Emergency contact relationship'
} as const;
type PassengerField = keyof typeof PASSENGER_FIELDS;
const PASSENGER_FIELD_NAMES = Object.keys(PASSENGER_FIELDS) as PassengerField[];
const PASSENGER_FIELD_MAX = 200;

const passengerDetails = (s: { fullName: string } & Record<PassengerField, string | null>) => ({
  fullName: s.fullName,
  pickupPoint: s.pickupPoint,
  homeLocation: s.homeLocation,
  emerContactName: s.emerContactName,
  emerContactPhone: s.emerContactPhone,
  emerRelationship: s.emerRelationship
});

// The signed-in driver and one student with an approved seat on their bus.
// Answers the request itself and returns null when that isn't the case.
const findOwnPassenger = async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== Role.DRIVER) {
    res.status(403).json({ error: 'Access denied' });
    return null;
  }
  const rawId = String(req.params.studentId);
  if (!/^\d{1,9}$/.test(rawId)) {
    res.status(400).json({ error: 'Invalid student id' });
    return null;
  }
  const driver = await prisma.driver.findUnique({ where: { userId: req.user.userId } });
  if (!driver) {
    res.status(404).json({ error: 'Driver profile not found' });
    return null;
  }
  // Other buses' students get the same 404 as a missing one, so ids reveal nothing.
  const seat = await prisma.seatRequest.findFirst({
    where: { studentId: Number(rawId), driverId: driver.id, status: RequestStatus.APPROVED },
    include: { student: { include: { user: { select: { email: true } } } } }
  });
  if (!seat) {
    res.status(404).json({ error: 'Student not found on your bus' });
    return null;
  }
  return { driver, student: seat.student };
};

export const getPassengerDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const found = await findOwnPassenger(req, res);
    if (found) res.status(200).json({ student: passengerDetails(found.student) });
  } catch (error: any) {
    serverError(res, error);
  }
};

export const updatePassengerDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const found = await findOwnPassenger(req, res);
    if (!found) return;
    const { driver, student } = found;
    const body = req.body ?? {};

    const changes: Partial<Record<PassengerField, string | null>> = {};
    for (const field of PASSENGER_FIELD_NAMES) {
      if (!(field in body)) continue;
      const raw = body[field];
      if (raw !== null && typeof raw !== 'string') {
        res.status(400).json({ error: `${PASSENGER_FIELDS[field]} must be text.` });
        return;
      }
      const value = (raw ?? '').trim() || null;
      if (value && value.length > PASSENGER_FIELD_MAX) {
        res.status(400).json({ error: `${PASSENGER_FIELDS[field]} is too long.` });
        return;
      }
      if (value !== (student[field] || null)) changes[field] = value;
    }

    if ('pickupPoint' in changes && !changes.pickupPoint) {
      res.status(400).json({ error: 'Pickup point cannot be empty.' });
      return;
    }
    if (changes.emerContactPhone && !/^\+?[0-9][0-9\s-]{6,19}$/.test(changes.emerContactPhone)) {
      res.status(400).json({ error: 'Please enter a valid emergency contact phone number.' });
      return;
    }

    const changed = PASSENGER_FIELD_NAMES.filter(field => field in changes);
    if (changed.length === 0) {
      res.status(200).json({ message: 'No changes to save.', student: passengerDetails(student) });
      return;
    }

    const updated = await prisma.student.update({ where: { id: student.id }, data: changes });

    // The student always hears about it: these are their details, changed by someone else.
    const labels = changed.map(field => PASSENGER_FIELDS[field].toLowerCase());
    await createNotification(student.userId, 'Your details were updated', `${driver.fullName} updated your ${labels.join(', ')}.`);
    void sendEmail(emails.detailsUpdatedByDriver(
      student.user.email,
      student.fullName,
      driver.fullName,
      changed.map(field => [PASSENGER_FIELDS[field], changes[field] ?? 'Removed'])
    ));

    res.status(200).json({ message: 'Student details updated.', student: passengerDetails(updated) });
  } catch (error: any) {
    serverError(res, error);
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
    serverError(res, error);
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
    serverError(res, error);
  }
};
