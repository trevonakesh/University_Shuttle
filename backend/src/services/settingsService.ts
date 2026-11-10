import prisma from '../prismaClient';

const COMMISSION_KEY = 'commission_rate';
const DEFAULT_COMMISSION = 0.10; // 10%
const SIGNUP_OPTIONS_KEY = 'signup_options';

// The choices in the sign-up dropdowns, used until an admin changes them.
const DEFAULT_SIGNUP_OPTIONS = {
  universities: ['NSBM', 'SLIIT'],
  faculties: ['Science', 'Engineering', 'Arts'],
  degreePrograms: ['BSc', 'BEng', 'BA'],
  academicYears: ['Year 1', 'Year 2', 'Year 3', 'Year 4'],
  relationships: ['Parent', 'Sibling', 'Guardian'],
  banks: ['BOC', 'Commercial', 'HNB', 'Sampath'],
  schedules: ['Weekly (Mon-Fri)', 'Weekend Only', 'Everyday']
};
export type SignupOptions = typeof DEFAULT_SIGNUP_OPTIONS;
export type SignupOptionList = keyof SignupOptions;
export const SIGNUP_OPTION_LISTS = Object.keys(DEFAULT_SIGNUP_OPTIONS) as SignupOptionList[];

export const getSignupOptions = async (): Promise<SignupOptions> => {
  const setting = await prisma.systemSetting.findUnique({ where: { key: SIGNUP_OPTIONS_KEY } });
  const options = { ...DEFAULT_SIGNUP_OPTIONS };
  if (!setting) return options;
  try {
    const saved = JSON.parse(setting.value);
    for (const list of SIGNUP_OPTION_LISTS) {
      if (Array.isArray(saved[list]) && saved[list].length > 0) options[list] = saved[list];
    }
  } catch {
    console.error('Stored sign-up options are not valid JSON; using the defaults.');
  }
  return options;
};

export const setSignupOptions = async (options: SignupOptions): Promise<void> => {
  const value = JSON.stringify(options);
  await prisma.systemSetting.upsert({
    where: { key: SIGNUP_OPTIONS_KEY },
    create: { key: SIGNUP_OPTIONS_KEY, value },
    update: { value }
  });
};

// True when every filled-in value is on the current university list. Blank
// values pass: callers decide which fields are required.
export const universitiesAllowed = async (...values: unknown[]): Promise<boolean> => {
  const filled = values.filter((v): v is string => typeof v === 'string' && v.trim() !== '');
  if (filled.length === 0) return true;
  const { universities } = await getSignupOptions();
  const allowed = new Set(universities.map(u => u.toLowerCase()));
  return filled.every(v => allowed.has(v.trim().toLowerCase()));
};

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
