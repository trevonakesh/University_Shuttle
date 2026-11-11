import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import prisma from '../prismaClient';
import { Role } from '@prisma/client';
import { sendEmail, emails } from '../services/email';
import { getSignupForm, parseCustomAnswers, universitiesAllowed } from '../services/settingsService';
import { findUserByEmail, normalizeEmail } from '../services/userLookup';
import { signToken } from '../utils/jwt';
import { passwordError } from '../utils/password';
import { createAttemptTracker, minutesLabel } from '../utils/rateLimit';
import { serverError } from '../utils/httpError';

const generateToken = (userId: number, role: Role) => signToken({ userId, role }, '7d');

const RESET_CODE_MINUTES = 15;
const WINDOW_MS = 15 * 60 * 1000;

// Brute-force protection. Failures are counted per account (the email or
// phone typed, whether or not it exists, so a lock reveals nothing) and per
// IP address (stops one machine spraying many accounts).
const loginFailsByAccount = createAttemptTracker({ windowMs: WINDOW_MS, max: 5 });
const loginFailsByIp = createAttemptTracker({ windowMs: WINDOW_MS, max: 30 });
const resetRequestsByEmail = createAttemptTracker({ windowMs: WINDOW_MS, max: 3 }); // also stops email bombing
const resetRequestsByIp = createAttemptTracker({ windowMs: WINDOW_MS, max: 10 });
// After this many wrong guesses a reset code is destroyed, so guessing one
// of the million codes has odds of at most 5 in 1,000,000 per code issued.
const MAX_CODE_GUESSES = 5;
const codeGuessesByEmail = createAttemptTracker({ windowMs: WINDOW_MS, max: MAX_CODE_GUESSES });
const codeGuessesByIp = createAttemptTracker({ windowMs: WINDOW_MS, max: 20 });

const accountKey = (v: unknown) => String(v ?? '').trim().toLowerCase();

const tooMany = (res: Response, seconds: number, what: string): void => {
  res.setHeader('Retry-After', seconds);
  res.status(429).json({ error: `Too many ${what}. Please try again in ${minutesLabel(seconds)}.` });
};

const displayName = (user: { student?: { fullName: string } | null; driver?: { fullName: string } | null }) =>
  user.student?.fullName ?? user.driver?.fullName ?? '';

// Readable IP for the sign-in alert ("::ffff:1.2.3.4" -> "1.2.3.4").
const clientIp = (req: Request): string => {
  const ip = (req.ip || '').replace(/^::ffff:/, '');
  return ip === '::1' || ip === '127.0.0.1' ? `${ip} (this computer)` : ip;
};

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

    const key = accountKey(email);
    const wait = Math.max(resetRequestsByEmail.blockedFor(key), resetRequestsByIp.blockedFor(req.ip ?? ''));
    if (wait) return tooMany(res, wait, 'reset requests');
    resetRequestsByEmail.fail(key);
    resetRequestsByIp.fail(req.ip ?? '');

    const user = await findUserByEmail(email);
    const generic = { message: 'If an account exists for that email, a reset code has been sent.' };

    if (!user || user.deactivatedAt) {
      res.status(200).json(generic);
      return;
    }

    const code = String(crypto.randomInt(100000, 1000000)); // 6 digits, cryptographically random
    const codeHash = await bcrypt.hash(code, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { resetCodeHash: codeHash, resetCodeExpiry: new Date(Date.now() + RESET_CODE_MINUTES * 60 * 1000) }
    });
    codeGuessesByEmail.reset(key); // a fresh code gets a fresh set of guesses

    // The code only ever travels by email — never in this response, or anyone
    // who knows an address could reset that account's password.
    void sendEmail(emails.passwordResetCode(user.email, displayName(user), code, RESET_CODE_MINUTES));

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
    const weak = passwordError(newPassword, [email]);
    if (weak) {
      res.status(400).json({ error: weak });
      return;
    }

    const key = accountKey(email);
    const ip = req.ip ?? '';
    const wait = Math.max(codeGuessesByEmail.blockedFor(key), codeGuessesByIp.blockedFor(ip));
    if (wait) return tooMany(res, wait, 'wrong codes');

    const user = await findUserByEmail(email);
    if (!user || !user.resetCodeHash || !user.resetCodeExpiry) {
      codeGuessesByIp.fail(ip);
      res.status(400).json({ error: 'No reset request found. Please request a new code.' });
      return;
    }
    if (user.resetCodeExpiry.getTime() < Date.now()) {
      res.status(400).json({ error: 'This code has expired. Please request a new one.' });
      return;
    }

    // Codes are six digits: spaces or other characters picked up when copying
    // the code out of the email are ignored.
    const matches = await bcrypt.compare(String(code).replace(/\D/g, ''), user.resetCodeHash);
    if (!matches) {
      codeGuessesByIp.fail(ip);
      const guesses = codeGuessesByEmail.fail(key);
      if (guesses >= MAX_CODE_GUESSES) {
        // Burn the code: the owner has to request a new one from their inbox.
        await prisma.user.update({ where: { id: user.id }, data: { resetCodeHash: null, resetCodeExpiry: null } });
        res.status(400).json({ error: 'Too many wrong codes. That code no longer works. Please request a new one.' });
        return;
      }
      const left = MAX_CODE_GUESSES - guesses;
      res.status(400).json({ error: `That code doesn't match. Only the code in the newest email works. ${left} attempt${left === 1 ? '' : 's'} left.` });
      return;
    }

    const passwordHash = await bcrypt.hash(String(newPassword), 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetCodeHash: null, resetCodeExpiry: null }
    });
    codeGuessesByEmail.reset(key);
    loginFailsByAccount.reset(key); // the real owner just proved themselves

    void sendEmail(emails.passwordChanged(user.email, displayName(user)));

    res.status(200).json({ message: 'Password reset successful. You can now log in.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Returns what's wrong with a sign-up, or null when it's fine. Registration is
// public, so bad input gets a clear 400 instead of a database error.
const registrationError = (body: any, requiredFields: Record<string, string>): string | null => {
  for (const [field, label] of Object.entries(requiredFields)) {
    if (typeof body?.[field] !== 'string' || !body[field].trim()) return `${label} is required.`;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) return 'Please enter a valid email address.';
  return passwordError(body.password, [body.email]);
};

// Optional unique columns: a blank must be stored as null, or the second
// person who leaves the field empty is rejected as a duplicate.
const blankToNull = (v: unknown): string | null =>
  typeof v === 'string' && v.trim() ? v.trim() : null;

export const registerStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const invalid = registrationError(req.body, {
      email: 'Email', password: 'Password', phone: 'Phone number',
      fullName: 'Full name', universityName: 'University'
    });
    if (invalid) {
      res.status(400).json({ error: invalid });
      return;
    }

    const email = normalizeEmail(req.body.email);
    const phone = String(req.body.phone).trim();
    const {
      password, fullName, universityName,
      pickupPoint, destination, faculty, degreeProgram, academicYear,
      registrationNo, homeLocation, emerContactName, emerContactPhone,
      emerRelationship, profilePhotoUrl
    } = req.body;

    if (!await universitiesAllowed(universityName, destination)) {
      res.status(400).json({ error: 'Please choose a university from the list.' });
      return;
    }

    const custom = parseCustomAnswers((await getSignupForm()).student.custom, req.body.customFields, { enforceRequired: true });
    if (custom.error) {
      res.status(400).json({ error: custom.error });
      return;
    }

    const nic = blankToNull(req.body.nic);
    const studentId = blankToNull(req.body.studentId);

    const existingUser = await findUserByEmail(email) ?? await prisma.user.findFirst({ where: { phone } });

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
            profilePhotoUrl,
            customFields: custom.answers
          }
        }
      },
      include: { student: true }
    });

    const token = generateToken(user.id, user.role);

    void sendEmail(emails.welcomeStudent(user.email, fullName));

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
    serverError(res, error);
  }
};

export const registerDriver = async (req: Request, res: Response): Promise<void> => {
  try {
    const invalid = registrationError(req.body, {
      email: 'Email', password: 'Password', phone: 'Phone number',
      fullName: 'Full name', nic: 'NIC number'
    });
    if (invalid) {
      res.status(400).json({ error: invalid });
      return;
    }

    const email = normalizeEmail(req.body.email);
    const phone = String(req.body.phone).trim();
    const {
      password, fullName, nic, bankName, accNumber, accHolder,
      busCapacity, routeName, startingPoint, destination, monthlyFee,
      dailyFeeRoundTrip, dailyFeeOneWay,
      scheduleType, pickupTime, dropTime, profilePhotoUrl, nicCopyUrl, licenseCopyUrl,
      vehicleRegUrl, busPhotoUrl
    } = req.body;

    if (!await universitiesAllowed(destination)) {
      res.status(400).json({ error: 'Please choose a university from the list.' });
      return;
    }

    const custom = parseCustomAnswers((await getSignupForm()).driver.custom, req.body.customFields, { enforceRequired: true });
    if (custom.error) {
      res.status(400).json({ error: custom.error });
      return;
    }

    const licenseNumber = blankToNull(req.body.licenseNumber);
    const busRegNumber = blankToNull(req.body.busRegNumber);

    const existingUser = await findUserByEmail(email) ?? await prisma.user.findFirst({ where: { phone } });

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
            dailyFeeRoundTrip,
            dailyFeeOneWay,
            scheduleType,
            pickupTime,
            dropTime,
            profilePhotoUrl,
            nicCopyUrl,
            licenseCopyUrl,
            vehicleRegUrl,
            busPhotoUrl,
            customFields: custom.answers
          }
        }
      },
      include: { driver: true }
    });

    const token = generateToken(user.id, user.role);

    void sendEmail(emails.driverApplicationReceived(user.email, fullName));

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
    serverError(res, error);
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, phone, password } = req.body;

    if (!email && !phone) {
      res.status(400).json({ error: 'Please provide email or phone' });
      return;
    }
    if (!password) {
      res.status(400).json({ error: 'Please enter your password' });
      return;
    }

    const key = accountKey(email || phone);
    const ip = req.ip ?? '';
    const wait = Math.max(loginFailsByAccount.blockedFor(key), loginFailsByIp.blockedFor(ip));
    if (wait) return tooMany(res, wait, 'failed sign-in attempts');

    const user = email
      ? await findUserByEmail(email)
      : await prisma.user.findFirst({ where: { phone: String(phone).trim() }, include: { student: true, driver: true } });

    const isMatch = user ? await bcrypt.compare(String(password), user.passwordHash) : false;

    if (!user || !isMatch) {
      loginFailsByAccount.fail(key);
      loginFailsByIp.fail(ip);
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    loginFailsByAccount.reset(key);

    // Checked only after the password matches, so it reveals nothing to guessers.
    if (user.deactivatedAt) {
      res.status(403).json({ error: 'This account has been closed. Contact Uni Shuttle if you think this is a mistake.' });
      return;
    }

    if (user.role === Role.DRIVER && user.driver?.status === 'REJECTED') {
      res.status(403).json({ error: 'Your account application was rejected.' });
      return;
    }

    const token = generateToken(user.id, user.role);

    const profile = user.role === Role.STUDENT ? user.student : user.driver;

    void sendEmail(emails.signInAlert(
      user.email,
      displayName(user),
      emails.describeDevice(req.get('user-agent')),
      clientIp(req)
    ));

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
    serverError(res, error);
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
    serverError(res, error);
  }
};
