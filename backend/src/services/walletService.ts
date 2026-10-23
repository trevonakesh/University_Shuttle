import { Prisma } from '@prisma/client';
import { HttpError } from '../utils/httpError';

// Takes `amount` out of a driver's wallet only if the balance covers it, in a
// single conditional UPDATE. Postgres re-checks the WHERE clause after taking
// the row lock, so two payouts racing each other can't both pass a balance
// check that only one of them fits in. Returns the new balance.
export const debitWallet = async (tx: Prisma.TransactionClient, driverId: number, amount: number): Promise<number> => {
  const { count } = await tx.driver.updateMany({
    where: { id: driverId, walletBalance: { gte: amount - 0.001 } },
    data: { walletBalance: { decrement: amount } }
  });
  const driver = await tx.driver.findUnique({ where: { id: driverId }, select: { walletBalance: true } });
  if (!driver) throw new HttpError(404, 'Driver not found');
  if (count === 0) {
    throw new HttpError(409, `The driver's wallet balance is LKR ${driver.walletBalance.toFixed(2)}, which doesn't cover LKR ${amount.toFixed(2)}.`);
  }
  return driver.walletBalance;
};
