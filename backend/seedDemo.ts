// Resets the database and builds a clean, presentation-ready dataset.
// Run:  npx ts-node --transpile-only seedDemo.ts
//
// Every account below exists to demonstrate one specific feature — see the
// summary printed at the end.
import 'dotenv/config';
import prisma from './src/prismaClient';
import bcrypt from 'bcrypt';
import { Role, DriverStatus, RequestStatus, FareStatus, PaymentStatus } from '@prisma/client';

const PASSWORD = 'demo123';
const ADMIN_PASSWORD = 'admin123';

// Month helpers so the data is always correct whenever this is re-run.
const now = new Date();
const ym = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const THIS_MONTH = ym(now);
const LAST_MONTH = ym(new Date(now.getFullYear(), now.getMonth() - 1, 1));
const TWO_MONTHS_AGO = ym(new Date(now.getFullYear(), now.getMonth() - 2, 1));

const dateIn = (month: string, day: number) => new Date(`${month}-${String(day).padStart(2, '0')}T09:00:00Z`);

async function wipe() {
  // Children first so foreign keys never block the delete.
  await prisma.payoutRequest.deleteMany();
  await prisma.payout.deleteMany();
  await prisma.pollResponse.deleteMany();
  await prisma.poll.deleteMany();
  await prisma.notice.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.monthlyFare.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.seatRequest.deleteMany();
  await prisma.student.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.user.deleteMany();
  console.log('✓ Cleared all existing data');
}

async function main() {
  await wipe();

  const hash = await bcrypt.hash(PASSWORD, 10);
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  // ---------- ADMIN ----------
  await prisma.user.create({
    data: { email: 'admin@unishuttle.com', phone: '0112000000', passwordHash: adminHash, role: Role.ADMIN }
  });

  // ---------- DRIVERS ----------
  const sunil = await prisma.user.create({
    data: {
      email: 'sunil@demo.com', phone: '0771234567', passwordHash: hash, role: Role.DRIVER,
      driver: {
        create: {
          fullName: 'Sunil Perera', nic: '821234567V', licenseNumber: 'B1234567',
          busRegNumber: 'NA-4521', busCapacity: '32',
          routeName: 'Homagama - NSBM', startingPoint: 'Homagama', destination: 'NSBM',
          monthlyFee: '5000', scheduleType: 'Weekdays', pickupTime: '06:45 AM', dropTime: '05:30 PM',
          bankName: 'Commercial Bank', accNumber: '8001234567', accHolder: 'H.K. Sunil Perera',
          status: DriverStatus.APPROVED, walletBalance: 18000
        }
      }
    },
    include: { driver: true }
  });

  const nimal = await prisma.user.create({
    data: {
      email: 'nimal@demo.com', phone: '0772345678', passwordHash: hash, role: Role.DRIVER,
      driver: {
        create: {
          fullName: 'Nimal Fernando', nic: '790987654V', licenseNumber: 'B7654321',
          busRegNumber: 'NB-8834', busCapacity: '28',
          routeName: 'Kottawa - NSBM', startingPoint: 'Kottawa', destination: 'NSBM',
          monthlyFee: '4500', scheduleType: 'Weekdays', pickupTime: '07:00 AM', dropTime: '05:15 PM',
          bankName: 'Sampath Bank', accNumber: '1042998877', accHolder: 'W.A. Nimal Fernando',
          status: DriverStatus.APPROVED, walletBalance: 4050
        }
      }
    },
    include: { driver: true }
  });

  // Awaiting verification — approve this one live during the demo.
  await prisma.user.create({
    data: {
      email: 'kamal@demo.com', phone: '0773456789', passwordHash: hash, role: Role.DRIVER,
      driver: {
        create: {
          fullName: 'Kamal Silva', nic: '885566778V', licenseNumber: 'B9988776',
          busRegNumber: 'NC-1290', busCapacity: '30',
          routeName: 'Malabe - SLIIT', startingPoint: 'Malabe', destination: 'SLIIT',
          monthlyFee: '5500', scheduleType: 'Weekdays', pickupTime: '07:15 AM', dropTime: '05:45 PM',
          bankName: 'Hatton National Bank', accNumber: '0551122334', accHolder: 'K.G. Kamal Silva',
          status: DriverStatus.PENDING, walletBalance: 0
        }
      }
    }
  });

  // ---------- STUDENTS ----------
  const mkStudent = async (
    email: string, phone: string, fullName: string, nic: string, studentId: string,
    pickupPoint: string, university = 'NSBM'
  ) => prisma.user.create({
    data: {
      email, phone, passwordHash: hash, role: Role.STUDENT,
      student: {
        create: {
          fullName, nic, studentId,
          universityName: university, faculty: 'Computing', degreeProgram: 'BSc (Hons) Computer Science',
          academicYear: 'Year 2', homeLocation: pickupPoint, pickupPoint, destination: university
        }
      }
    },
    include: { student: true }
  });

  const amaya    = await mkStudent('amaya@demo.com',    '0761111111', 'Amaya Jayasuriya',    '200145600789', 'NSBM-2021-001', 'Homagama Town');
  const dinuka   = await mkStudent('dinuka@demo.com',   '0762222222', 'Dinuka Rathnayake',   '200233400567', 'NSBM-2021-002', 'Pannipitiya');
  const tharindu = await mkStudent('tharindu@demo.com', '0763333333', 'Tharindu Bandara',    '200156700345', 'NSBM-2021-003', 'Maharagama');
  const senaya   = await mkStudent('senaya@demo.com',   '0764444444', 'Senaya Wickramasinghe','200278900123', 'NSBM-2022-004', 'Kottawa Junction');
  // Unassigned on purpose — do the seat-request flow live.
  await mkStudent('ishara@demo.com', '0765555555', 'Ishara Gunawardena', '200312300901', 'NSBM-2022-005', 'Homagama Town');

  const sunilId = sunil.driver!.id;
  const nimalId = nimal.driver!.id;

  // ---------- ASSIGNMENTS ----------
  // approvedOn drives the freeze grace rule, so it is set explicitly.
  const assign = async (studentId: number, driverId: number, approvedOn: Date) => {
    const sr = await prisma.seatRequest.create({
      data: { studentId, driverId, status: RequestStatus.APPROVED }
    });
    await prisma.$executeRaw`UPDATE "SeatRequest" SET "createdAt" = ${approvedOn}, "updatedAt" = ${approvedOn} WHERE id = ${sr.id}`;
    return sr;
  };

  const longAgo = dateIn(TWO_MONTHS_AGO, 3);
  await assign(amaya.student!.id, sunilId, longAgo);
  await assign(dinuka.student!.id, sunilId, longAgo);
  await assign(tharindu.student!.id, sunilId, longAgo);
  // Joined after the 10th of THIS month => still in the grace period.
  await assign(senaya.student!.id, sunilId, dateIn(THIS_MONTH, 20));

  // ---------- PAYMENTS + FARES ----------
  const payInApp = async (studentId: number, driverId: number, month: string, amount: number, day: number) => {
    const commission = Math.round(amount * 0.10 * 100) / 100;
    const payment = await prisma.payment.create({
      data: {
        studentId, driverId, amount, adminCommission: commission, month,
        status: PaymentStatus.COMPLETED, paymentMethod: 'IN_APP',
        referenceNo: `PAYHERE-${month.replace('-', '')}${studentId}`,
        paymentDate: dateIn(month, day)
      }
    });
    await prisma.monthlyFare.create({
      data: { studentId, driverId, month, status: FareStatus.PAID, amount, markedBy: 'STUDENT_APP', paymentId: payment.id }
    });
  };

  const payCash = async (studentId: number, driverId: number, month: string, amount: number, day: number) => {
    const commission = Math.round(amount * 0.10 * 100) / 100;
    const payment = await prisma.payment.create({
      data: {
        studentId, driverId, amount, adminCommission: commission, month,
        status: PaymentStatus.COMPLETED, paymentMethod: 'CASH',
        referenceNo: `CASH-${month.replace('-', '')}${studentId}`,
        paymentDate: dateIn(month, day)
      }
    });
    await prisma.monthlyFare.create({
      data: { studentId, driverId, month, status: FareStatus.PAID, amount, markedBy: 'DRIVER', paymentId: payment.id }
    });
  };

  // History: two settled months so Earnings and reports are not empty.
  for (const m of [TWO_MONTHS_AGO, LAST_MONTH]) {
    await payInApp(amaya.student!.id, sunilId, m, 5000, 5);
    await payInApp(dinuka.student!.id, sunilId, m, 5000, 7);
    await payCash(tharindu.student!.id, sunilId, m, 5000, 8);
  }

  // This month — the states the demo actually shows off:
  await payInApp(amaya.student!.id, sunilId, THIS_MONTH, 5000, 4);          // PAID
  await prisma.monthlyFare.create({                                         // "didn't come" => frozen this month
    data: { studentId: tharindu.student!.id, driverId: sunilId, month: THIS_MONTH, status: FareStatus.EXEMPT, amount: 5000, markedBy: 'DRIVER' }
  });
  // Dinuka: no fare row at all => UNPAID past the 10th => FROZEN
  // Senaya: no fare row, but joined after the 10th => grace period, not frozen

  // ---------- NOTICE + POLL ----------
  await prisma.notice.create({
    data: {
      driverId: sunilId,
      title: 'Earlier departure this Friday',
      content: 'The bus will leave Homagama at 6:30 AM instead of 6:45 AM this Friday due to expected traffic on the Highway. Please be at your pickup point 10 minutes early.'
    }
  });
  await prisma.notice.create({
    data: {
      driverId: sunilId,
      title: 'Monthly fare reminder',
      content: 'Please settle your monthly fare before the 10th to keep your account active. You can pay in the app by card, or hand cash to me directly.'
    }
  });

  const tomorrow = new Date(now.getTime() + 86400000);
  const poll = await prisma.poll.create({
    data: {
      driverId: sunilId,
      date: `${ym(tomorrow)}-${String(tomorrow.getDate()).padStart(2, '0')}`,
      question: 'Are you travelling tomorrow?'
    }
  });
  await prisma.pollResponse.create({ data: { pollId: poll.id, studentId: amaya.student!.id, isComing: true } });
  await prisma.pollResponse.create({ data: { pollId: poll.id, studentId: dinuka.student!.id, isComing: false } });

  // ---------- PAYOUT HISTORY ----------
  await prisma.payout.create({
    data: {
      driverId: nimalId, amount: 12000, method: 'BANK_TRANSFER',
      referenceNo: 'SLIP-2026-0087', note: 'Settled last month\'s earnings',
      createdAt: dateIn(LAST_MONTH, 28)
    }
  });

  // ---------- SUMMARY ----------
  console.log(`
════════════════════════════════════════════════════════════════
  UNI SHUTTLE — DEMO DATA READY        (fare month: ${THIS_MONTH})
════════════════════════════════════════════════════════════════

  ADMIN PANEL          admin@unishuttle.com / ${ADMIN_PASSWORD}

  DRIVERS                                     password: ${PASSWORD}
  ─────────────────────────────────────────────────────────────
  sunil@demo.com     Sunil Perera · NA-4521 · Homagama→NSBM
                     MAIN DRIVER · 4 passengers · wallet LKR 18,000
  nimal@demo.com     Nimal Fernando · NB-8834 · Kottawa→NSBM
                     second NSBM option (shows student choice)
  kamal@demo.com     Kamal Silva · NC-1290 · Malabe→SLIIT
                     ⚠ PENDING APPROVAL — approve him live on stage

  STUDENTS (all NSBM, on Sunil's bus)         password: ${PASSWORD}
  ─────────────────────────────────────────────────────────────
  amaya@demo.com     PAID this month — the happy path
  dinuka@demo.com    UNPAID past the 10th — ACCOUNT FROZEN
  tharindu@demo.com  "DIDN'T COME" — frozen for this month only
  senaya@demo.com    UNPAID, still in grace — shows the due warning
  ishara@demo.com    UNASSIGNED — do the seat-request flow live

  ALSO SEEDED
  ─────────────────────────────────────────────────────────────
  • ${TWO_MONTHS_AGO} + ${LAST_MONTH} payments (in-app & cash) for history
  • 2 notices, 1 attendance poll with votes
  • 1 past payout to Nimal (SLIP-2026-0087)
  • Bank details on every driver, for payout review

════════════════════════════════════════════════════════════════
`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => process.exit(0));
