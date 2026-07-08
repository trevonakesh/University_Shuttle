import prisma from '../prismaClient';
import { FareStatus, RequestStatus } from '@prisma/client';
import { FREEZE_DAY, currentDay, currentMonth, colomboMonthAndDay } from '../utils/time';

// monthlyFee is stored as a string on Driver; normalise to a number.
export const parseFee = (monthlyFee: string | null | undefined): number => {
  if (!monthlyFee) return 0;
  const fee = parseFloat(String(monthlyFee).replace(/[^\d.]/g, ''));
  return Number.isFinite(fee) && fee > 0 ? fee : 0;
};

export const getActiveAssignment = (studentId: number) =>
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

export interface FrozenCheck {
  frozen: boolean;
  month: string;
  status: FareStatus | null; // null = no assignment
  amountDue: number;
  driverId: number | null;
  driverName: string | null;
}

// Frozen = past the 10th (Colombo time) and the current month's fare is
// neither PAID nor EXEMPT. Computed on the fly so paying unfreezes instantly.
export const checkFrozen = async (studentId: number): Promise<FrozenCheck> => {
  const month = currentMonth();
  const assignment = await getActiveAssignment(studentId);

  if (!assignment) {
    return { frozen: false, month, status: null, amountDue: 0, driverId: null, driverName: null };
  }

  const fare = await prisma.monthlyFare.findUnique({
    where: {
      studentId_driverId_month: { studentId, driverId: assignment.driverId, month }
    }
  });

  const status = fare?.status ?? FareStatus.UNPAID;
  const settled = status === FareStatus.PAID || status === FareStatus.EXEMPT;
  const frozen =
    !settled &&
    currentDay() > FREEZE_DAY &&
    !isInGracePeriod(assignment.updatedAt);

  return {
    frozen,
    month,
    status,
    amountDue: settled ? 0 : parseFee(assignment.driver.monthlyFee),
    driverId: assignment.driverId,
    driverName: assignment.driver.fullName
  };
};

export const createNotification = (userId: number, title: string, message: string) =>
  prisma.notification.create({ data: { userId, title, message } });
