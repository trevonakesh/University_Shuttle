import 'dotenv/config';
import prisma from './src/prismaClient';
import jwt from 'jsonwebtoken';

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'driver@test.com' } });
  if (!user) {
    console.log("No driver user found");
    return;
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: '24h' }
  );

  console.log("Token:", token);

  const response = await fetch('http://localhost:3000/api/requests/driver', {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const text = await response.text();
  console.log("API Status:", response.status);
  console.log("API Response:", text);
}

main().finally(() => prisma.$disconnect());
