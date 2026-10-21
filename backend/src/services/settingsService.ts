import prisma from '../prismaClient';

const COMMISSION_KEY = 'commission_rate';
const DEFAULT_COMMISSION = 0.10; // 10%

/**
 * Returns the current platform commission rate (0–1).
 * Falls back to DEFAULT_COMMISSION if the setting has never been saved.
 */
export const getCommissionRate = async (): Promise<number> => {
  const setting = await prisma.systemSetting.findUnique({ where: { key: COMMISSION_KEY } });
  if (!setting) return DEFAULT_COMMISSION;
  const v = parseFloat(setting.value);
  return Number.isFinite(v) && v >= 0 && v <= 1 ? v : DEFAULT_COMMISSION;
};

/**
 * Persists a new commission rate (0–1).
 * Pass 0 to disable the commission entirely.
 */
export const setCommissionRate = async (rate: number): Promise<void> => {
  await prisma.systemSetting.upsert({
    where: { key: COMMISSION_KEY },
    create: { key: COMMISSION_KEY, value: String(rate) },
    update: { value: String(rate) }
  });
};
