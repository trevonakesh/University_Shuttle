// Verifies the freeze rules by mocking the clock. Run: npx ts-node --transpile-only testFreeze.ts
// Assumes seed data: student 1 assigned to driver 1, 2026-07 PAID, 2026-08 UNPAID.
import 'dotenv/config';
import { checkFrozen } from './src/services/fareService';

const realNow = Date.now;
const at = (utcMs: number) => { Date.now = () => utcMs; };

let pass = 0, fail = 0;
const check = (name: string, cond: boolean, detail = '') => {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name} ${detail}`); }
};

const main = async () => {
  // Aug 15 (after the 10th), Aug fare UNPAID -> frozen
  at(Date.UTC(2026, 7, 15, 12));
  let r = await checkFrozen(1);
  check('Aug 15, unpaid month -> frozen', r.frozen === true, JSON.stringify(r));

  // Aug 5 (before the 10th), same unpaid month -> not frozen yet
  at(Date.UTC(2026, 7, 5, 12));
  r = await checkFrozen(1);
  check('Aug 5, unpaid month -> not frozen', r.frozen === false, JSON.stringify(r));

  // Jul 20 (after the 10th) but July is PAID -> not frozen
  at(Date.UTC(2026, 6, 20, 12));
  r = await checkFrozen(1);
  check('Jul 20, paid month -> not frozen', r.frozen === false, JSON.stringify(r));

  // Colombo boundary: Jul 10 18:35 UTC = Jul 11 00:05 Colombo -> past due day
  at(Date.UTC(2026, 6, 10, 18, 35));
  r = await checkFrozen(1);
  check('Colombo midnight rollover counts as the 11th (paid, so still false)', r.frozen === false && r.month === '2026-07', JSON.stringify(r));

  // Unassigned student (id 2) is never frozen
  at(Date.UTC(2026, 7, 15, 12));
  r = await checkFrozen(2);
  check('unassigned student -> never frozen', r.frozen === false && r.status === null, JSON.stringify(r));

  Date.now = realNow;
  console.log(`\n==== ${pass} passed, ${fail} failed ====`);
  process.exit(fail === 0 ? 0 : 1);
};

main().catch(e => { console.error(e); process.exit(1); });
