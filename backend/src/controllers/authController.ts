import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../prismaClient';
import { Role } from '@prisma/client';

const generateToken = (userId: number, role: Role) => {
  const secret = process.env.JWT_SECRET || 'fallback_secret';
  return jwt.sign({ userId, role }, secret, { expiresIn: '7d' });
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
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

export const registerDriver = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, phone, fullName, nic, licenseNumber, bankName, accNumber, accHolder } = req.body;

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
            accHolder
          }
        }
      },
      include: { driver: true }
    });

    const token = generateToken(user.id, user.role);

    res.status(201).json({
      message: 'Driver registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        driver: user.driver
      }
    });
  } catch (error: any) {
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
