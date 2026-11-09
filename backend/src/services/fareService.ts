import prisma from '../prismaClient';
import { FareStatus, RequestStatus, Prisma } from '@prisma/client';
import { FREEZE_DAY, currentDay, currentMonth, colomboMonthAndDay, currentColomboDateString } from '../utils/time';
import { dailyRidePaymentsEnabled, onlinePaymentsEnabled } from './payhere';

// How a student settles a fare right now, for freeze and reminder messages.
export const payFareHint = (): string =>
  onlinePaymentsEnabled()
    ? 'Pay your monthly fare to unfreeze it.'
    : 'Hand the fare to your driver and ask them to mark it as paid to unfreeze it.';

// monthlyFee is stored as a string on Driver; normalise to a number.
export const parseFee = (monthlyFee: string | null | undefined): number => {
  if (!monthlyFee) return 0;
  const fee = parseFloat(String(monthlyFee).replace(/[^\d.]/g, ''));
  return Number.isFinite(fee) && fee > 0 ? fee : 0;
};

// Serialises every fare and payment write for one student/driver pair.
// Call first inside a transaction: the lock is held until it commits, so a
// card confirmation, a cash marking and a daily payment can never interleave
// and settle the same fare twice.
export const lockStudentDriver = (tx: Prisma.TransactionClient, studentId: number, driverId: number) =>
  tx.$executeRaw`SELECT pg_advisory_xact_lock(${studentId}::int, ${driverId}::int)`;

export const getActiveAssignment = async (studentId: number): Promise<any> =>
  prisma.seatRequest.findFirst({
    where: { studentId, status: RequestStatus.APPROVED },
    include: { driver: { include: { user: { select: { id: true } } } } }
  });

// Grace rule: a student approved after the FREEZE_DAY of the current month
// owes that month but is never frozen for it.
export const isInGracePeriod = (approvedAt: Date): boolean => {
  const approved = colomboMonthAndDay(approvedAt);
  return approved.month === currentMonth() && approved.day > FREEZE_DAY;
};

export type FreezeReason = 'UNPAID' | 'EXEMPT' | null;

export interface FrozenCheck {
  frozen: boolean;
  reason: FreezeReason;
  month: string;
  status: FareStatus | null; // null = no assignment
  amountDue: number;
  driverId: number | null;
  driverName: string | null;
}

// Frozen when, for the current Colombo month, either:
//  - the fare is UNPAID past the 10th (grace applies), or
//  - the driver marked the student EXEMPT ("didn't come") — frozen for that
//    month only; lifts automatically at month end, or instantly by paying.
export const checkFrozen = async (studentId: number): Promise<FrozenCheck> => {
  const month = currentMonth();
  const assignment = await getActiveAssignment(studentId);

  if (!assignment) {
    return { frozen: false, reason: null, month, status: null, amountDue: 0, driverId: null, driverName: null };
  }

  const fare = await prisma.monthlyFare.findUnique({
    where: {
      studentId_driverId_month: { studentId, driverId: assignment.driverId, month }
    }
  });

  const status = fare?.status ?? FareStatus.UNPAID;

  let frozen = false;
  let reason: FreezeReason = null;
  if (status === FareStatus.EXEMPT) {
    frozen = true;
    reason = 'EXEMPT';
  } else if (
    status === FareStatus.UNPAID &&
    currentDay() > FREEZE_DAY &&
    !isInGracePeriod(assignment.updatedAt)
  ) {
    frozen = true;
    reason = 'UNPAID';
  }

  // If frozen, but the student has a paid daily ride for *today*, unfreeze them
  // for today. While daily rides are cash-only there is no payment record, so
  // the driver's approval is what counts.
  if (frozen) {
    const todayStr = currentColomboDateString();
    const todaysRide = await prisma.dailyRideRequest.findFirst({
      where: {
        studentId,
        driverId: assignment.driverId,
        date: todayStr,
        ...(dailyRidePaymentsEnabled() ? { paymentId: { not: null } } : { status: RequestStatus.APPROVED })
      }
    });

    if (todaysRide) {
      frozen = false;
      reason = null; // Unfrozen just for today
    }
  }

  return {
    frozen,
    reason,
    month,
    status,
    // Paying reactivates the account in both frozen cases, so the fee is
    // still "due" unless the month is already PAID.
    amountDue: status === FareStatus.PAID ? 0 : parseFee(assignment.driver.monthlyFee),
    driverId: assignment.driverId,
    driverName: assignment.driver.fullName
  };
};

export const createNotification = async (userId: number, title: string, message: string): Promise<any> =>
  prisma.notification.create({ data: { userId, title, message } });
