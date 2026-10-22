import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../prismaClient';
import { DriverStatus, Role } from '@prisma/client';
import { emitDriverStatusUpdated } from '../socketHandler';
import { getCommissionRate, setCommissionRate } from '../services/settingsService';
import { sendEmail, emails } from '../services/email';

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
    const driverId = parseInt(req.params.id as string);
    const { status } = req.body;

    if (!Object.values(DriverStatus).includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const before = await prisma.driver.findUnique({ where: { id: driverId }, select: { status: true } });

    const driver = await prisma.driver.update({
      where: { id: driverId },
      data: { status },
      include: { user: { select: { email: true } } }
    });

    // Notify driver about status change
    emitDriverStatusUpdated(driverId, status);

    // Email only on an actual decision change, not on a repeated click.
    if (before?.status !== status) {
      if (status === DriverStatus.APPROVED) void sendEmail(emails.driverApproved(driver.user.email, driver.fullName));
      if (status === DriverStatus.REJECTED) void sendEmail(emails.driverRejected(driver.user.email, driver.fullName));
    }

    res.status(200).json(driver);
  } catch (error) {
    console.error('Error updating driver status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getStudentsByDriver = async (req: Request, res: Response) => {
  try {
    const driverId = parseInt(req.params.id as string);
    
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

// POST /api/admin/drivers — admin-created drivers are APPROVED immediately.
export const createDriver = async (req: Request, res: Response) => {
  try {
    const {
      email, password, phone, fullName, nic, licenseNumber,
      busRegNumber, busCapacity, routeName, startingPoint, destination,
      monthlyFee, scheduleType, pickupTime, dropTime,
      profilePhotoUrl, nicCopyUrl, licenseCopyUrl, vehicleRegUrl, busPhotoUrl
    } = req.body;

    if (!email || !password || !fullName || !nic) {
      return res.status(400).json({ message: 'email, password, fullName and nic are required' });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await prisma.user.create({
      data: {
        email,
        phone: phone || null,
        passwordHash,
        role: Role.DRIVER,
        driver: {
          create: {
            fullName,
            nic,
            licenseNumber: licenseNumber || null,
            busRegNumber: busRegNumber || null,
            busCapacity: busCapacity || null,
            routeName: routeName || null,
            startingPoint: startingPoint || null,
            destination: destination || null,
            monthlyFee: monthlyFee ? String(monthlyFee) : null,
            scheduleType: scheduleType || null,
            pickupTime: pickupTime || null,
            dropTime: dropTime || null,
            profilePhotoUrl: profilePhotoUrl || null,
            nicCopyUrl: nicCopyUrl || null,
            licenseCopyUrl: licenseCopyUrl || null,
            vehicleRegUrl: vehicleRegUrl || null,
            busPhotoUrl: busPhotoUrl || null,
            status: DriverStatus.APPROVED
          }
        }
      },
      include: { driver: { include: { user: { select: { email: true, phone: true } } } } }
    });

    void sendEmail(emails.accountCreatedByAdmin(user.email, fullName, 'DRIVER'));

    res.status(201).json(user.driver);
  } catch (error: any) {
    if (error.code === 'P2002') {
      const field = (error.meta?.target as string[])?.join(', ') || 'field';
      return res.status(400).json({ message: `A user with this ${field} already exists` });
    }
    console.error('Error creating driver:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/admin/drivers/:id — removes the driver's user account; all
// related data (assignments, payments, fares, polls, notices) cascades.
export const deleteDriver = async (req: Request, res: Response) => {
  try {
    const driverId = parseInt(String(req.params.id));
    const driver = await prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    await prisma.user.delete({ where: { id: driver.userId } });
    res.status(200).json({ message: 'Driver deleted' });
  } catch (error) {
    console.error('Error deleting driver:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/admin/students — all students on the platform.
export const getStudents = async (req: Request, res: Response) => {
  try {
    const students = await prisma.student.findMany({
      include: {
        user: { select: { email: true, phone: true } },
        seatRequests: {
          where: { status: 'APPROVED' },
          select: { driver: { select: { fullName: true, busRegNumber: true } } }
        }
      },
      orderBy: { id: 'desc' }
    });

    res.status(200).json(students.map(s => ({
      id: s.id,
      fullName: s.fullName,
      studentId: s.studentId,
      universityName: s.universityName,
      pickupPoint: s.pickupPoint,
      user: s.user,
      assignedDriver: s.seatRequests[0]?.driver ?? null
    })));
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/admin/students
export const createStudent = async (req: Request, res: Response) => {
  try {
    const {
      email, password, phone, fullName, nic, studentId,
      universityName, faculty, degreeProgram, academicYear,
      pickupPoint, destination, homeLocation, profilePhotoUrl
    } = req.body;

    if (!email || !password || !fullName || !universityName) {
      return res.status(400).json({ message: 'email, password, fullName and universityName are required' });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await prisma.user.create({
      data: {
        email,
        phone: phone || null,
        passwordHash,
        role: Role.STUDENT,
        student: {
          create: {
            fullName,
            nic: nic || null,
            studentId: studentId || null,
            universityName,
            faculty: faculty || null,
            degreeProgram: degreeProgram || null,
            academicYear: academicYear || null,
            pickupPoint: pickupPoint || null,
            destination: destination || null,
            homeLocation: homeLocation || null,
            profilePhotoUrl: profilePhotoUrl || null
          }
        }
      },
      include: { student: { include: { user: { select: { email: true, phone: true } } } } }
    });

    void sendEmail(emails.accountCreatedByAdmin(user.email, fullName, 'STUDENT'));

    res.status(201).json(user.student);
  } catch (error: any) {
    if (error.code === 'P2002') {
      const field = (error.meta?.target as string[])?.join(', ') || 'field';
      return res.status(400).json({ message: `A user with this ${field} already exists` });
    }
    console.error('Error creating student:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/admin/students/:id
export const deleteStudent = async (req: Request, res: Response) => {
  try {
    const studentId = parseInt(String(req.params.id));
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    await prisma.user.delete({ where: { id: student.userId } });
    res.status(200).json({ message: 'Student deleted' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/admin/payouts — settle (part of) a driver's wallet balance.
// Records the transaction and decrements the wallet atomically.
export const createPayout = async (req: Request, res: Response) => {
  try {
    const { driverId, amount, method, referenceNo, note } = req.body;

    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      return res.status(400).json({ message: 'Amount must be a positive number' });
    }

    const allowedMethods = ['BANK_TRANSFER', 'CASH'];
    const payoutMethod = allowedMethods.includes(method) ? method : 'BANK_TRANSFER';

    const driver = await prisma.driver.findUnique({
      where: { id: Number(driverId) },
      include: { user: { select: { id: true, email: true } } }
    });
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    if (numAmount > driver.walletBalance + 0.001) {
      return res.status(400).json({
        message: `Amount exceeds the driver's wallet balance (LKR ${driver.walletBalance.toFixed(2)})`
      });
    }

    const [payout, updatedDriver] = await prisma.$transaction([
      prisma.payout.create({
        data: {
          driverId: driver.id,
          amount: numAmount,
          method: payoutMethod,
          referenceNo: referenceNo || null,
          note: note || null
        }
      }),
      prisma.driver.update({
        where: { id: driver.id },
        data: { walletBalance: { decrement: numAmount } }
      })
    ]);

    await prisma.notification.create({
      data: {
        userId: driver.user.id,
        title: 'Payout Received',
        message: `LKR ${numAmount.toFixed(2)} was paid out to you via ${payoutMethod.replace('_', ' ').toLowerCase()}${referenceNo ? ` (ref: ${referenceNo})` : ''}. Remaining wallet balance: LKR ${updatedDriver.walletBalance.toFixed(2)}.`
      }
    });

    void sendEmail(emails.payoutSent(driver.user.email, driver.fullName, numAmount, payoutMethod, referenceNo || null, updatedDriver.walletBalance));

    res.status(201).json({ payout, walletBalance: updatedDriver.walletBalance });
  } catch (error) {
    console.error('Error creating payout:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/admin/payouts — payout history, newest first.
export const getPayouts = async (req: Request, res: Response) => {
  try {
    const payouts = await prisma.payout.findMany({
      include: {
        driver: { select: { fullName: true, busRegNumber: true, walletBalance: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(payouts);
  } catch (error) {
    console.error('Error fetching payouts:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/admin/settings/commission — returns the current commission rate.
export const getCommissionRateHandler = async (_req: Request, res: Response) => {
  try {
    const rate = await getCommissionRate();
    res.status(200).json({ commissionRate: rate });
  } catch (error) {
    console.error('Error fetching commission rate:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/admin/settings/commission — updates the commission rate.
// Body: { commissionRate: number }  — expects a value between 0 and 1.
// Pass 0 to disable commissions entirely.
export const updateCommissionRateHandler = async (req: Request, res: Response) => {
  try {
    const { commissionRate } = req.body;
    const rate = parseFloat(commissionRate);

    if (!Number.isFinite(rate) || rate < 0 || rate > 1) {
      return res.status(400).json({ message: 'commissionRate must be a number between 0 and 1 (e.g. 0.10 for 10%).' });
    }

    await setCommissionRate(rate);
    res.status(200).json({ message: 'Commission rate updated.', commissionRate: rate });
  } catch (error) {
    console.error('Error updating commission rate:', error);
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
          select: { fullName: true, busRegNumber: true, walletBalance: true }
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
