import { FareStatus, PayoutRequestStatus, RequestStatus } from '@prisma/client';
import prisma from '../prismaClient';
import { HttpError } from '../utils/httpError';

export type RemovalResult = { archived: boolean; message: string };

// Records that make up the books: once any exist, the account is deactivated
// rather than deleted (the schema's Restrict rules enforce this too).
const KEPT_FARE_STATUSES = [FareStatus.PAID, FareStatus.EXEMPT];

const OPEN_RIDE_STATUSES = [RequestStatus.PENDING, RequestStatus.APPROVED];

// Removes a student. Without financial history the account is deleted
// outright; with it, the account is deactivated: the student can't sign in
// and leaves their bus, but every payment and fare record stays.
export const removeStudent = async (studentId: number): Promise<RemovalResult> => {
  return prisma.$transaction(async (tx) => {
    const student = await tx.student.findUnique({ where: { id: studentId } });
    if (!student) throw new HttpError(404, 'Student not found');

    const [payments, keptFares] = await Promise.all([
      tx.payment.count({ where: { studentId } }),
      tx.monthlyFare.count({ where: { studentId, status: { in: KEPT_FARE_STATUSES } } })
    ]);

    if (payments === 0 && keptFares === 0) {
      // Nothing financial: clear the leftover non-money rows the Restrict
      // rules would block on, then delete (the rest cascades).
      await tx.monthlyFare.deleteMany({ where: { studentId } });
      await tx.dailyRideRequest.deleteMany({ where: { studentId } });
      await tx.user.delete({ where: { id: student.userId } });
      return { archived: false, message: 'Student deleted' };
    }

    await tx.user.update({ where: { id: student.userId }, data: { deactivatedAt: new Date(), resetCodeHash: null, resetCodeExpiry: null } });
    await tx.seatRequest.updateMany({ where: { studentId, status: { in: OPEN_RIDE_STATUSES } }, data: { status: RequestStatus.CANCELLED } });
    await tx.dailyRideRequest.updateMany({ where: { studentId, status: { in: OPEN_RIDE_STATUSES }, paymentId: null }, data: { status: RequestStatus.CANCELLED } });
    return { archived: true, message: 'Student removed. Their payment history has been kept for your records, so the account was deactivated instead of deleted.' };
  });
};

// Removes a driver, on the same rules. A driver who is still owed money
// can't be removed until it's paid out — otherwise the balance is orphaned.
// Their passengers lose the seat and get an in-app notice.
export const removeDriver = async (driverId: number): Promise<RemovalResult> => {
  return prisma.$transaction(async (tx) => {
    // Lock the row so a payment landing mid-removal waits, and the wallet
    // check below sees the final balance.
    await tx.$executeRaw`SELECT 1 FROM "Driver" WHERE id = ${driverId} FOR UPDATE`;
    const driver = await tx.driver.findUnique({ where: { id: driverId } });
    if (!driver) throw new HttpError(404, 'Driver not found');

    const [payments, payouts, payoutRequests, keptFares] = await Promise.all([
      tx.payment.count({ where: { driverId } }),
      tx.payout.count({ where: { driverId } }),
      tx.payoutRequest.count({ where: { driverId } }),
      tx.monthlyFare.count({ where: { driverId, status: { in: KEPT_FARE_STATUSES } } })
    ]);

    if (payments + payouts + payoutRequests + keptFares === 0) {
      await tx.monthlyFare.deleteMany({ where: { driverId } });
      await tx.dailyRideRequest.deleteMany({ where: { driverId } });
      await tx.user.delete({ where: { id: driver.userId } });
      return { archived: false, message: 'Driver deleted' };
    }

    if (driver.walletBalance > 0.009) {
      throw new HttpError(400, `${driver.fullName} still has LKR ${driver.walletBalance.toFixed(2)} in their wallet. Pay it out before removing them.`);
    }

    const passengers = await tx.seatRequest.findMany({
      where: { driverId, status: RequestStatus.APPROVED },
      select: { student: { select: { userId: true } } }
    });

    await tx.user.update({ where: { id: driver.userId }, data: { deactivatedAt: new Date(), resetCodeHash: null, resetCodeExpiry: null } });
    await tx.seatRequest.updateMany({ where: { driverId, status: { in: OPEN_RIDE_STATUSES } }, data: { status: RequestStatus.CANCELLED } });
    await tx.dailyRideRequest.updateMany({ where: { driverId, status: { in: OPEN_RIDE_STATUSES }, paymentId: null }, data: { status: RequestStatus.CANCELLED } });
    await tx.payoutRequest.updateMany({
      where: { driverId, status: PayoutRequestStatus.PENDING },
      data: { status: PayoutRequestStatus.REJECTED, adminNote: 'Account closed', reviewedAt: new Date() }
    });
    if (passengers.length > 0) {
      await tx.notification.createMany({
        data: passengers.map(p => ({
          userId: p.student.userId,
          title: 'Your bus is no longer available',
          message: `${driver.fullName}'s bus${driver.busRegNumber ? ` (${driver.busRegNumber})` : ''} has left Uni Shuttle, so your seat was cancelled. Browse the available buses to request a new one.`
        }))
      });
    }
    return { archived: true, message: `Driver removed. Their payment and payout history has been kept for your records, so the account was deactivated instead of deleted.${passengers.length ? ` ${passengers.length} passenger(s) were notified.` : ''}` };
  });
};
