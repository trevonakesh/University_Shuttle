import 'dotenv/config';
import prisma from './src/prismaClient';
import bcrypt from 'bcrypt';

async function main() {
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);

  // 1. Create Driver Account
  const driverEmail = 'driver@test.com';
  const existingDriver = await prisma.user.findUnique({ where: { email: driverEmail } });
  
  if (!existingDriver) {
    await prisma.user.create({
      data: {
        email: driverEmail,
        phone: '0711234567',
        passwordHash: hashedPassword,
        role: 'DRIVER',
        driver: {
          create: {
            fullName: 'Test Driver',
            nic: '123456789V',
            licenseNumber: 'B1234567',
            busRegNumber: 'ND-1234',
            routeName: 'NSBM - Kandy',
            status: 'APPROVED',
          },
        },
      },
    });
    console.log('Test Driver created successfully!');
  } else {
    console.log('Test Driver already exists!');
  }

  // 2. Create Student Account
  const studentEmail = 'student@test.com';
  const existingStudent = await prisma.user.findUnique({ where: { email: studentEmail } });

  if (!existingStudent) {
    await prisma.user.create({
      data: {
        email: studentEmail,
        phone: '0777654321',
        passwordHash: hashedPassword,
        role: 'STUDENT',
        student: {
          create: {
            fullName: 'Test Student',
            nic: '987654321V',
            studentId: 'STU12345',
            universityName: 'NSBM',
            faculty: 'Science',
            degreeProgram: 'BSc Computer Science',
            academicYear: 'Year 3',
            homeLocation: 'Kandy',
            pickupPoint: 'Kandy Town',
            destination: 'NSBM',
          },
        },
      },
    });
    console.log('Test Student created successfully!');
  } else {
    console.log('Test Student already exists!');
  }

  console.log('\n--- Accounts Ready ---');
  console.log(`Driver: ${driverEmail} / ${password}`);
  console.log(`Student: ${studentEmail} / ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
