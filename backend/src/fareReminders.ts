import prisma from './prismaClient';
import { FareStatus, RequestStatus } from '@prisma/client';
import { FREEZE_DAY, currentDay, currentMonth } from './utils/time';
import { parseFee, isInGracePeriod, payFareHint } from './services/fareService';
import { onlinePaymentsEnabled } from './services/payhere';
import { sendEmail, emails } from './services/email';

const REMINDER_DAY = 8; // "pay before the 10th" reminders start on the 8th
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // every 6 hours

// Creates at most one notification per student per month per kind, using the
// month embedded in the title for dedupe (no extra tables needed). Returns
// true only when it created one, so the matching email is sent once too —
// the sweep itself runs every few hours.
const notifyOnce = async (userId: number, title: string, message: string): Promise<boolean> => {
  const existing = await prisma.notification.findFirst({ where: { userId, title } });
  if (existing) return false;
  await prisma.notification.create({ data: { userId, title, message } });
  return true;
};

export const runFareReminderSweep = async (): Promise<void> => {
  const day = currentDay();
  const month = currentMonth();
  if (day < REMINDER_DAY) return;

  const assignments = await prisma.seatRequest.findMany({
    where: { status: RequestStatus.APPROVED },
    include: {
      student: { include: { user: { select: { id: true, email: true } } } },
      driver: { select: { monthlyFee: true, fullName: true } }
    }
  });
  if (assignments.length === 0) return;

  const fares = await prisma.monthlyFare.findMany({
    where: { month, status: { in: [FareStatus.PAID, FareStatus.EXEMPT] } },
    select: { studentId: true, driverId: true }
  });
  const settled = new Set(fares.map(f => `${f.studentId}:${f.driverId}`));

  for (const a of assignments) {
    if (settled.has(`${a.studentId}:${a.driverId}`)) continue;
    if (isInGracePeriod(a.updatedAt)) continue;

    const fee = parseFee(a.driver.monthlyFee);
    const userId = a.student.user.id;
    const { email } = a.student.user;

    if (day <= FREEZE_DAY) {
      const created = await notifyOnce(
        userId,
        `Fare Reminder ${month}`,
        `Your ${month} bus fare (LKR ${fee.toFixed(2)}) to ${a.driver.fullName} is due by the ${FREEZE_DAY}th. ${onlinePaymentsEnabled() ? 'Pay in the app or hand it' : 'Hand it'} to your driver to avoid your account being frozen.`
      );
      if (created) void sendEmail(emails.fareReminder(email, a.student.fullName, month, fee, FREEZE_DAY, a.driver.fullName));
    } else {
      const created = await notifyOnce(
        userId,
        `Account Frozen ${month}`,
        `Your account is frozen because the ${month} fare (LKR ${fee.toFixed(2)}) was not paid by the ${FREEZE_DAY}th. ${payFareHint()}`
      );
      if (created) void sendEmail(emails.accountFrozen(email, a.student.fullName, month, fee, FREEZE_DAY));
    }
  }
};

export const startFareReminderJob = (): void => {
  const sweep = () =>
    runFareReminderSweep().catch(err => console.error('[fareReminders] sweep failed:', err));
  sweep(); // run once at startup
  setInterval(sweep, CHECK_INTERVAL_MS);
};
