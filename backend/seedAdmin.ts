// Creates a platform admin account. Both values are required; there is no
// default login. Run with:
//   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-long-strong-password' npx ts-node --transpile-only seedAdmin.ts
import 'dotenv/config';
import prisma from './src/prismaClient';
import bcrypt from 'bcrypt';
import { findUserByEmail, normalizeEmail } from './src/services/userLookup';
import { passwordError } from './src/utils/password';

const ADMIN_MIN_LENGTH = 12; // an admin can see and change everyone's details

async function main() {
  const email = normalizeEmail(process.env.ADMIN_EMAIL);
  const password = process.env.ADMIN_PASSWORD ?? '';

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password) {
    throw new Error('Set ADMIN_EMAIL to a real email address and ADMIN_PASSWORD to the password to use.');
  }
  const weak = password.length < ADMIN_MIN_LENGTH
    ? `An admin password must be at least ${ADMIN_MIN_LENGTH} characters.`
    : passwordError(password, [email]);
  if (weak) throw new Error(weak);

  if (await findUserByEmail(email)) {
    console.log(`Admin already exists: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { email, passwordHash, role: 'ADMIN' } });
  console.log(`Admin created: ${email}`);
}

main()
  .catch(error => {
    console.error(`Not created: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
