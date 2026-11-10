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

// ---------- sign-up form layout ----------

const SIGNUP_FORM_KEY = 'signup_form';

// Every built-in sign-up field. `locked` fields can't be removed because
// sign-in, bus matching or fares depend on them.
export const SIGNUP_FIELDS = {
  student: [
    { name: 'fullName', label: 'Full name', locked: true },
    { name: 'email', label: 'Email address', locked: true },
    { name: 'phone', label: 'Phone number', locked: true },
    { name: 'password', label: 'Password', locked: true },
    { name: 'nic', label: 'NIC number' },
    { name: 'studentId', label: 'Student ID' },
    { name: 'profilePhotoUrl', label: 'Profile photo' },
    { name: 'universityName', label: 'University', locked: true },
    { name: 'faculty', label: 'Faculty' },
    { name: 'degreeProgram', label: 'Degree / program' },
    { name: 'academicYear', label: 'Academic year' },
    { name: 'registrationNo', label: 'Registration number' },
    { name: 'homeLocation', label: 'Home location' },
    { name: 'pickupPoint', label: 'Pickup point', locked: true },
    { name: 'destination', label: 'Destination university', locked: true },
    { name: 'emerContactName', label: 'Emergency contact name' },
    { name: 'emerContactPhone', label: 'Emergency contact phone' },
    { name: 'emerRelationship', label: 'Emergency contact relationship' }
  ],
  driver: [
    { name: 'fullName', label: 'Full name', locked: true },
    { name: 'nic', label: 'NIC number', locked: true },
    { name: 'email', label: 'Email address', locked: true },
    { name: 'phone', label: 'Phone number', locked: true },
    { name: 'password', label: 'Password', locked: true },
    { name: 'licenseNumber', label: 'Driving licence number' },
    { name: 'profilePhotoUrl', label: 'Profile photo' },
    { name: 'bankName', label: 'Bank' },
    { name: 'accNumber', label: 'Bank account number' },
    { name: 'accHolder', label: 'Bank account holder' },
    { name: 'busRegNumber', label: 'Bus registration number' },
    { name: 'busCapacity', label: 'Number of seats' },
    { name: 'routeName', label: 'Route name' },
    { name: 'startingPoint', label: 'Starting point' },
    { name: 'destination', label: 'Destination university', locked: true },
    { name: 'scheduleType', label: 'Schedule' },
    { name: 'pickupTime', label: 'Pickup time' },
    { name: 'dropTime', label: 'Drop time' },
    { name: 'monthlyFee', label: 'Monthly fare', locked: true },
    { name: 'dailyFeeRoundTrip', label: 'Daily fare, round trip', locked: true },
    { name: 'dailyFeeOneWay', label: 'Daily fare, one way', locked: true },
    { name: 'nicCopyUrl', label: 'NIC copy' },
    { name: 'licenseCopyUrl', label: 'Driving licence copy' },
    { name: 'vehicleRegUrl', label: 'Vehicle registration copy' },
    { name: 'busPhotoUrl', label: 'Bus photo' }
  ]
} as { student: BuiltInField[]; driver: BuiltInField[] };

interface BuiltInField { name: string; label: string; locked?: boolean }

export type FormKind = 'student' | 'driver';
export type CustomFieldType = 'text' | 'number' | 'phone' | 'select';
export interface CustomField {
  key: string;
  label: string;
  type: CustomFieldType;
  required: boolean;
  options?: string[];
}
export interface FormLayout { hidden: string[]; custom: CustomField[] }
export type SignupForm = Record<FormKind, FormLayout>;

export const getSignupForm = async (): Promise<SignupForm> => {
  const form: SignupForm = { student: { hidden: [], custom: [] }, driver: { hidden: [], custom: [] } };
  const setting = await prisma.systemSetting.findUnique({ where: { key: SIGNUP_FORM_KEY } });
  if (!setting) return form;
  try {
    const saved = JSON.parse(setting.value);
    for (const kind of ['student', 'driver'] as const) {
      if (Array.isArray(saved[kind]?.hidden)) form[kind].hidden = saved[kind].hidden;
      if (Array.isArray(saved[kind]?.custom)) form[kind].custom = saved[kind].custom;
    }
  } catch {
    console.error('Stored sign-up form is not valid JSON; using the full form.');
  }
  return form;
};

export const setSignupForm = async (form: SignupForm): Promise<void> => {
  const value = JSON.stringify(form);
  await prisma.systemSetting.upsert({
    where: { key: SIGNUP_FORM_KEY },
    create: { key: SIGNUP_FORM_KEY, value },
    update: { value }
  });
};

const CUSTOM_ANSWER_MAX = 500;
const CUSTOM_PHONE = /^\+?[0-9][0-9\s-]{6,19}$/;
const CUSTOM_NUMBER = /^-?\d{1,12}(\.\d{1,4})?$/;

// Checks submitted answers against the current custom fields. Keys that aren't
// on the form are dropped. An answer equal to `existing` is always accepted,
// so a dropdown choice that has since been removed survives an unrelated edit.
export const parseCustomAnswers = (
  fields: CustomField[],
  raw: unknown,
  { enforceRequired, existing = {} }: { enforceRequired: boolean; existing?: Record<string, string> }
): { answers: Record<string, string>; error?: string } => {
  const answers: Record<string, string> = {};
  const given = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  for (const field of fields) {
    const value = given[field.key];
    if (value !== undefined && value !== null && typeof value !== 'string') {
      return { answers, error: `${field.label} must be text.` };
    }
    const text = typeof value === 'string' ? value.trim() : '';
    if (!text) {
      if (enforceRequired && field.required) return { answers, error: `${field.label} is required.` };
      continue;
    }
    if (text.length > CUSTOM_ANSWER_MAX) return { answers, error: `${field.label} is too long.` };
    if (text !== existing[field.key]) {
      if (field.type === 'number' && !CUSTOM_NUMBER.test(text)) return { answers, error: `${field.label} must be a number.` };
      if (field.type === 'phone' && !CUSTOM_PHONE.test(text)) return { answers, error: `Please enter a valid ${field.label.toLowerCase()}.` };
      if (field.type === 'select' && !field.options?.includes(text)) return { answers, error: `Please choose ${field.label.toLowerCase()} from the list.` };
    }
    answers[field.key] = text;
  }
  return { answers };
};

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
