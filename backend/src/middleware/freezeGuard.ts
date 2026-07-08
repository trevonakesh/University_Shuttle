import { Response, NextFunction } from 'express';
import prisma from '../prismaClient';
import { Role } from '@prisma/client';
import { AuthRequest } from './authMiddleware';
import { checkFrozen } from '../services/fareService';

// Blocks students whose account is frozen (current-month fare unpaid after
// the 10th) from performing the guarded action. Payments and read endpoints
// must NOT use this guard, otherwise the student cannot unfreeze themselves.
export const freezeGuard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role !== Role.STUDENT) {
      next();
      return;
    }

    const student = await prisma.student.findUnique({ where: { userId: req.user.userId } });
    if (!student) {
      next();
      return;
    }

    const { frozen, amountDue, month } = await checkFrozen(student.id);
    if (frozen) {
      res.status(403).json({
        error: `Your account is frozen: the ${month} fare (LKR ${amountDue.toFixed(2)}) was not paid by the 10th. Pay your monthly fare to unfreeze it.`,
        code: 'ACCOUNT_FROZEN'
      });
      return;
    }

    next();
  } catch (error) {
    // Never let the guard itself take the API down.
    next();
  }
};
