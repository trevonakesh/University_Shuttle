import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { verifyToken } from '../utils/jwt';
import prisma from '../prismaClient';

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    role: Role;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication token missing or invalid' });
    return;
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Authentication token missing' });
    return;
  }

  try {
    const decoded = verifyToken<{ userId?: number; role?: Role }>(token);
    // Other tokens we sign (e.g. PayHere checkout links) carry no user.
    if (typeof decoded.userId !== 'number' || !decoded.role) throw new Error('not a login token');

    req.user = { userId: decoded.userId, role: decoded.role };
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  // A token stays valid for days, so check the account still exists and
  // hasn't been closed by an admin; otherwise a removed user keeps access.
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { deactivatedAt: true } });
    if (!user || user.deactivatedAt) {
      res.status(401).json({ error: 'This account is no longer active. Please sign in again.' });
      return;
    }
  } catch (error) {
    console.error('[auth] account check failed:', error);
    res.status(500).json({ error: 'Server error' });
    return;
  }
  next();
};

export const authorizeRole = (roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
      return;
    }
    next();
  };
};
