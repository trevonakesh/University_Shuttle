import { Response, NextFunction } from 'express';
import prisma from '../prismaClient';
import { Role } from '@prisma/client';
import { AuthRequest } from './authMiddleware';
import { checkFrozen, payFareHint } from '../services/fareService';

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

    const { frozen, reason, amountDue, month } = await checkFrozen(student.id);
    if (frozen) {
      const message = reason === 'EXEMPT'
        ? `Your account is frozen for ${month}: your driver marked you as not travelling this month. It unfreezes automatically next month. Planning to travel? The fare is LKR ${amountDue.toFixed(2)}. ${payFareHint()}`
        : `Your account is frozen: the ${month} fare (LKR ${amountDue.toFixed(2)}) was not paid by the 10th. ${payFareHint()}`;
      res.status(403).json({ error: message, code: 'ACCOUNT_FROZEN', reason });
      return;
    }

    next();
  } catch (error) {
    // Never let the guard itself take the API down.
    next();
  }
};
