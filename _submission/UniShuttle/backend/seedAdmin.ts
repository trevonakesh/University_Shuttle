// Creates the platform admin account. Run with: npx ts-node --transpile-only seedAdmin.ts
import 'dotenv/config';
import prisma from './src/prismaClient';
import bcrypt from 'bcrypt';

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@unishuttle.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin already exists: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { email, passwordHash, role: 'ADMIN' }
  });
  console.log(`Admin created: ${email} / ${password} — change this password in production!`);
}

main().finally(() => process.exit(0));
