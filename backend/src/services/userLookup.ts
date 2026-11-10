import prisma from '../prismaClient';

// Emails are matched ignoring capital letters and surrounding spaces, so a
// capital or a trailing space added by a phone keyboard still finds the
// account. New emails are stored normalized; the lookup also covers accounts
// saved before that.
export const normalizeEmail = (value: unknown): string => String(value ?? '').trim().toLowerCase();

export const findUserByEmail = async (value: unknown, exceptUserId?: number) => {
  const email = normalizeEmail(value);
  if (!email) return null;
  const rows = await prisma.$queryRaw<Array<{ id: number }>>`
    SELECT id FROM "User" WHERE lower(trim(email)) = ${email} ORDER BY id`;
  const match = rows.find(row => row.id !== exceptUserId);
  if (!match) return null;
  return prisma.user.findUnique({ where: { id: match.id }, include: { student: true, driver: true } });
};
