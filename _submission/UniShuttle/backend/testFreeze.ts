// Verifies the freeze rules by mocking the clock. Run: npx ts-node --transpile-only testFreeze.ts
// Assumes seed data: student 1 assigned to driver 1, 2026-07 PAID, 2026-08 UNPAID.
import 'dotenv/config';
import prisma from './src/prismaClient';
import { checkFrozen } from './src/services/fareService';
import { FareStatus } from '@prisma/client';

const realNow = Date.now;
const at = (utcMs: number) => { Date.now = () => utcMs; };

let pass = 0, fail = 0;
const check = (name: string, cond: boolean, detail = '') => {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name} ${detail}`); }
};

const AUG_KEY = { studentId_driverId_month: { studentId: 1, driverId: 1, month: '2026-08' } };

const main = async () => {
  // --- UNPAID rules ---
  at(Date.UTC(2026, 7, 15, 12));
  let r = await checkFrozen(1);
  check('Aug 15, unpaid month -> frozen (UNPAID)', r.frozen === true && r.reason === 'UNPAID', JSON.stringify(r));

  at(Date.UTC(2026, 7, 5, 12));
  r = await checkFrozen(1);
  check('Aug 5, unpaid month -> not frozen yet', r.frozen === false, JSON.stringify(r));

  at(Date.UTC(2026, 6, 20, 12));
  r = await checkFrozen(1);
  check('Jul 20, paid month -> not frozen', r.frozen === false, JSON.stringify(r));

  // --- EXEMPT ("didn't come") rules: frozen for that month only ---
  const before = await prisma.monthlyFare.findUnique({ where: AUG_KEY });
  await prisma.monthlyFare.upsert({
    where: AUG_KEY,
    create: { studentId: 1, driverId: 1, month: '2026-08', status: FareStatus.EXEMPT, amount: 5000, markedBy: 'DRIVER' },
    update: { status: FareStatus.EXEMPT, markedBy: 'DRIVER' }
  });

  at(Date.UTC(2026, 7, 5, 12)); // Aug 5 — even before the 10th
  r = await checkFrozen(1);
  check("Aug 5, marked didn't come -> frozen immediately (EXEMPT)", r.frozen === true && r.reason === 'EXEMPT', JSON.stringify(r));

  at(Date.UTC(2026, 7, 25, 12)); // Aug 25
  r = await checkFrozen(1);
  check("Aug 25, still exempt -> still frozen", r.frozen === true && r.reason === 'EXEMPT', JSON.stringify(r));
  check('exempt month: fare still payable to reactivate', r.amountDue > 0, String(r.amountDue));

  at(Date.UTC(2026, 8, 5, 12)); // Sep 5 — next month
  r = await checkFrozen(1);
  check('Sep 5 -> freeze lifted automatically (only that month)', r.frozen === false, JSON.stringify(r));

  // Paying the exempt month unfreezes it
  await prisma.monthlyFare.update({ where: AUG_KEY, data: { status: FareStatus.PAID, markedBy: 'STUDENT_APP' } });
  at(Date.UTC(2026, 7, 25, 12));
  r = await checkFrozen(1);
  check('exempt month paid -> unfrozen within the month', r.frozen === false, JSON.stringify(r));

  // restore original state
  if (before) {
    await prisma.monthlyFare.update({
      where: AUG_KEY,
      data: { status: before.status, markedBy: before.markedBy }
    });
  } else {
    await prisma.monthlyFare.delete({ where: AUG_KEY });
  }

  // --- misc ---
  at(Date.UTC(2026, 7, 15, 12));
  r = await checkFrozen(2);
  check('unassigned student -> never frozen', r.frozen === false && r.status === null, JSON.stringify(r));

  Date.now = realNow;
  console.log(`\n==== ${pass} passed, ${fail} failed ====`);
  process.exit(fail === 0 ? 0 : 1);
};

main().catch(e => { console.error(e); process.exit(1); });
