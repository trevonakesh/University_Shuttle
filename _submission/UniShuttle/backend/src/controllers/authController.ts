import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../prismaClient';
import { Role } from '@prisma/client';

const generateToken = (userId: number, role: Role) => {
  const secret = process.env.JWT_SECRET || 'fallback_secret';
  return jwt.sign({ userId, role }, secret, { expiresIn: '7d' });
};

// True once a real email/SMS delivery provider is wired up. Until then the
// reset code is returned in the API response (dev convenience) instead of
// being delivered — clearly not for production.
const deliveryConfigured = (): boolean => Boolean(process.env.SMTP_HOST || process.env.EMAIL_API_KEY);

// POST /api/auth/forgot-password  { email }
// Generates a 6-digit code, stores it hashed with a 15-minute expiry.
// Always responds the same way so the endpoint can't be used to discover
// which emails have accounts.
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    const generic = { message: 'If an account exists for that email, a reset code has been sent.' };

    if (!user) {
      res.status(200).json(generic);
      return;
    }

    const code = String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
    const codeHash = await bcrypt.hash(code, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { resetCodeHash: codeHash, resetCodeExpiry: new Date(Date.now() + 15 * 60 * 1000) }
    });

    // TODO: when SMTP/EMAIL_API_KEY is set, send `code` to user.email here.
    if (!deliveryConfigured()) {
      console.log(`[password-reset] code for ${email}: ${code}`);
      res.status(200).json({ ...generic, devCode: code });
      return;
    }

    res.status(200).json(generic);
  } catch (error: any) {
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/auth/reset-password  { email, code, newPassword }
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      res.status(400).json({ error: 'Email, code and new password are required' });
      return;
    }
    if (String(newPassword).length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.resetCodeHash || !user.resetCodeExpiry) {
      res.status(400).json({ error: 'No reset request found. Please request a new code.' });
      return;
    }
    if (user.resetCodeExpiry.getTime() < Date.now()) {
      res.status(400).json({ error: 'This code has expired. Please request a new one.' });
      return;
    }

    const matches = await bcrypt.compare(String(code), user.resetCodeHash);
    if (!matches) {
      res.status(400).json({ error: 'Invalid reset code.' });
      return;
    }

    const passwordHash = await bcrypt.hash(String(newPassword), 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetCodeHash: null, resetCodeExpiry: null }
    });

    res.status(200).json({ message: 'Password reset successful. You can now log in.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const registerStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      email, password, phone, fullName, nic, universityName, studentId, 
      pickupPoint, destination, faculty, degreeProgram, academicYear, 
      registrationNo, homeLocation, emerContactName, emerContactPhone, 
      emerRelationship, profilePhotoUrl
    } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] }
    });

    if (existingUser) {
      res.status(400).json({ error: 'User with this email or phone already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email,
        phone,
        passwordHash,
        role: Role.STUDENT,
        student: {
          create: {
            fullName,
            nic,
            universityName,
            studentId,
            pickupPoint,
            destination,
            faculty,
            degreeProgram,
            academicYear,
            registrationNo,
            homeLocation,
            emerContactName,
            emerContactPhone,
            emerRelationship,
            profilePhotoUrl
          }
        }
      },
      include: { student: true }
    });

    const token = generateToken(user.id, user.role);

    res.status(201).json({
      message: 'Student registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        student: user.student
      }
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      const target = error.meta?.target as string[];
      const field = target ? target.join(', ') : 'field';
      res.status(400).json({ error: `Student with this ${field} already exists` });
      return;
    }
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

export const registerDriver = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      email, password, phone, fullName, nic, licenseNumber, bankName, accNumber, accHolder,
      busRegNumber, busCapacity, routeName, startingPoint, destination, monthlyFee,
      scheduleType, pickupTime, dropTime, profilePhotoUrl, nicCopyUrl, licenseCopyUrl,
      vehicleRegUrl, busPhotoUrl
    } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] }
    });

    if (existingUser) {
      res.status(400).json({ error: 'User with this email or phone already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email,
        phone,
        passwordHash,
        role: Role.DRIVER,
        driver: {
          create: {
            fullName,
            nic,
            licenseNumber,
            bankName,
            accNumber,
            accHolder,
            busRegNumber,
            busCapacity,
            routeName,
            startingPoint,
            destination,
            monthlyFee,
            scheduleType,
            pickupTime,
            dropTime,
            profilePhotoUrl,
            nicCopyUrl,
            licenseCopyUrl,
            vehicleRegUrl,
            busPhotoUrl
          }
        }
      },
      include: { driver: true }
    });

    const token = generateToken(user.id, user.role);

    res.status(201).json({
      message: 'Driver registered successfully. Pending admin approval.',
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profile: user.driver
      }
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      const target = error.meta?.target as string[];
      const field = target ? target.join(', ') : 'field';
      res.status(400).json({ error: `Driver with this ${field} already exists` });
      return;
    }
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, phone, password } = req.body;

    if (!email && !phone) {
      res.status(400).json({ error: 'Please provide email or phone' });
      return;
    }

    const user = await prisma.user.findFirst({
      where: email ? { email } : { phone },
      include: { student: true, driver: true }
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (user.role === Role.DRIVER && user.driver?.status === 'REJECTED') {
      res.status(403).json({ error: 'Your account application was rejected.' });
      return;
    }

    const token = generateToken(user.id, user.role);

    const profile = user.role === Role.STUDENT ? user.student : user.driver;

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profile
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { student: true, driver: true }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const profile = user.role === Role.STUDENT ? user.student : user.driver;

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profile
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};
