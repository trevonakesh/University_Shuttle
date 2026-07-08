// One-off: creates PAID MonthlyFare rows for payments that predate the fare
// ledger. Run with: npx ts-node backfillFares.ts
import 'dotenv/config';
import prisma from './src/prismaClient';
import { FareStatus } from '@prisma/client';

const main = async () => {
  const payments = await prisma.payment.findMany({ where: { status: 'COMPLETED' } });
  let created = 0;

  for (const p of payments) {
    const existing = await prisma.monthlyFare.findUnique({
      where: {
        studentId_driverId_month: { studentId: p.studentId, driverId: p.driverId, month: p.month }
      }
    });
    if (!existing) {
      await prisma.monthlyFare.create({
        data: {
          studentId: p.studentId,
          driverId: p.driverId,
          month: p.month,
          status: FareStatus.PAID,
          amount: p.amount,
          paymentId: p.id,
          markedBy: p.paymentMethod === 'CASH' ? 'DRIVER' : 'STUDENT_APP'
        }
      });
      created++;
    }
  }

  console.log(`Backfill complete: ${created} fare rows created from ${payments.length} payments.`);
};

main().finally(() => process.exit(0));
