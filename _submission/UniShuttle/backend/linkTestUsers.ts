import 'dotenv/config';
import prisma from './src/prismaClient';

async function main() {
  const driverUser = await prisma.user.findUnique({ where: { email: 'driver@test.com' }, include: { driver: true } });
  const studentUser = await prisma.user.findUnique({ where: { email: 'student@test.com' }, include: { student: true } });

  if (driverUser?.driver && studentUser?.student) {
    const existing = await prisma.seatRequest.findUnique({
      where: {
        studentId_driverId: {
          studentId: studentUser.student.id,
          driverId: driverUser.driver.id,
        },
      },
    });

    if (!existing) {
      await prisma.seatRequest.create({
        data: {
          studentId: studentUser.student.id,
          driverId: driverUser.driver.id,
          status: 'APPROVED',
        },
      });
      console.log('Successfully linked student and driver!');
    } else if (existing.status !== 'APPROVED') {
      await prisma.seatRequest.update({
        where: { id: existing.id },
        data: { status: 'APPROVED' },
      });
      console.log('Updated link to APPROVED!');
    } else {
      console.log('Already linked and APPROVED!');
    }
  } else {
    console.log('Driver or Student not found!');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
