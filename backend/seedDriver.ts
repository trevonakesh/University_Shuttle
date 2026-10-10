import 'dotenv/config';
import prisma from './src/prismaClient';
import bcrypt from 'bcrypt';
async function main() {
  const email = 'driver@test.com';
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);

  const existingUser = await prisma.user.findUnique({ where: { email } });
  
  if (existingUser) {
    console.log('Test driver already exists!');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    return;
  }

  const user = await prisma.user.create({
    data: {
      email,
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
          monthlyFee: '5000',
          status: 'APPROVED',
          walletBalance: 1000
        },
      },
    },
  });

  console.log('Test driver created successfully!');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
