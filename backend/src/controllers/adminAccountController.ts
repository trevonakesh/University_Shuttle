import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { sendEmail, emails } from '../services/email';
import { createNotification } from '../services/fareService';
import crypto from 'crypto';
import { findUserByEmail, normalizeEmail } from '../services/userLookup';
import {
  getSignupForm, getSignupOptions, parseCustomAnswers, setSignupForm, setSignupOptions, universitiesAllowed,
  CustomField, CustomFieldType, FormKind, SIGNUP_FIELDS, SIGNUP_OPTION_LISTS, SignupOptionList
} from '../services/settingsService';

// Admin editing of what people entered at sign-up, and of the sign-up dropdowns.

const ACCOUNT_FIELDS = { email: 'Email', phone: 'Phone number' } as const;

const PROFILE_FIELDS = {
  driver: {
    fullName: 'Full name', nic: 'NIC number', licenseNumber: 'Driving licence number',
    bankName: 'Bank', accNumber: 'Bank account number', accHolder: 'Bank account holder',
    busRegNumber: 'Bus registration number', busCapacity: 'Number of seats', routeName: 'Route name',
    startingPoint: 'Starting point', destination: 'Destination university',
    monthlyFee: 'Monthly fare', dailyFeeRoundTrip: 'Daily fare, round trip', dailyFeeOneWay: 'Daily fare, one way',
    scheduleType: 'Schedule', pickupTime: 'Pickup time', dropTime: 'Drop time'
  },
  student: {
    fullName: 'Full name', nic: 'NIC number', studentId: 'Student ID',
    universityName: 'University', faculty: 'Faculty', degreeProgram: 'Degree / program',
    academicYear: 'Academic year', registrationNo: 'Registration number',
    homeLocation: 'Home location', pickupPoint: 'Pickup point', destination: 'Destination university',
    emerContactName: 'Emergency contact name', emerContactPhone: 'Emergency contact phone',
    emerRelationship: 'Emergency contact relationship'
  }
} as const;

type Kind = keyof typeof PROFILE_FIELDS;

const REQUIRED: Record<Kind, string[]> = {
  driver: ['email', 'fullName', 'nic'],
  student: ['email', 'fullName', 'universityName']
};
const UNIVERSITY_FIELDS: Record<Kind, string[]> = {
  driver: ['destination'],
  student: ['universityName', 'destination']
};
const AMOUNT_FIELDS = ['monthlyFee', 'dailyFeeRoundTrip', 'dailyFeeOneWay'];
const PHONE_FIELDS = ['phone', 'emerContactPhone'];

const MAX_LENGTH = 200;
const PHONE = /^\+?[0-9][0-9\s-]{6,19}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AMOUNT = /^\d{1,7}(\.\d{1,2})?$/;

const labelsFor = (kind: Kind): Record<string, string> => ({ ...ACCOUNT_FIELDS, ...PROFILE_FIELDS[kind] });

// Removed accounts keep their records but are no longer editable.
const loadAccount = async (kind: Kind, rawId: unknown) => {
  if (!/^\d{1,9}$/.test(String(rawId))) return null;
  const model = prisma[kind] as any;
  return model.findFirst({
    where: { id: Number(rawId), user: { deactivatedAt: null } },
    include: { user: { select: { id: true, email: true, phone: true } } }
  });
};

const details = (kind: Kind, account: any) => ({
  email: account.user.email,
  phone: account.user.phone,
  ...Object.fromEntries(Object.keys(PROFILE_FIELDS[kind]).map(f => [f, account[f]])),
  customFields: account.customFields ?? {}
});

const validationError = async (kind: Kind, changes: Record<string, string | null>): Promise<string | null> => {
  const labels = labelsFor(kind);
  for (const field of REQUIRED[kind]) {
    if (field in changes && !changes[field]) return `${labels[field]} is required.`;
  }
  if (changes.email && !EMAIL.test(changes.email)) return 'Please enter a valid email address.';
  for (const field of PHONE_FIELDS) {
    if (changes[field] && !PHONE.test(changes[field]!)) return `Please enter a valid ${labels[field].toLowerCase()}.`;
  }
  for (const field of AMOUNT_FIELDS) {
    if (changes[field] && !AMOUNT.test(changes[field]!)) return `${labels[field]} must be an amount in LKR, for example 5000.`;
  }
  if (changes.busCapacity && !/^\d{1,3}$/.test(changes.busCapacity)) return 'Number of seats must be a whole number.';
  if (!await universitiesAllowed(...UNIVERSITY_FIELDS[kind].map(f => changes[f]))) {
    return 'Please choose a university from the list.';
  }
  return null;
};

// Postgres names the column in different places depending on the driver, so
// look for it anywhere in the error details.
const duplicateMessage = (kind: Kind, error: any): string => {
  const labels = labelsFor(kind);
  const text = JSON.stringify(error.meta ?? {}).toLowerCase();
  const field = ['email', 'phone', 'nic', 'studentId', 'licenseNumber', 'busRegNumber'].find(f => text.includes(f.toLowerCase()));
  return field ? `Another account already uses this ${labels[field].toLowerCase()}.` : 'Another account already uses one of these details.';
};

const getAccount = (kind: Kind) => async (req: Request, res: Response) => {
  try {
    const account = await loadAccount(kind, req.params.id);
    if (!account) return res.status(404).json({ message: 'Account not found' });
    res.status(200).json(details(kind, account));
  } catch (error) {
    console.error(`Error fetching ${kind}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateAccount = (kind: Kind) => async (req: Request, res: Response) => {
  try {
    const account = await loadAccount(kind, req.params.id);
    if (!account) return res.status(404).json({ message: 'Account not found' });

    const labels = labelsFor(kind);
    const body = req.body ?? {};
    const changes: Record<string, string | null> = {};
    for (const field of Object.keys(labels)) {
      if (!(field in body)) continue;
      const raw = body[field];
      if (raw !== null && typeof raw !== 'string') {
        return res.status(400).json({ message: `${labels[field]} must be text.` });
      }
      let value: string | null = (raw ?? '').trim() || null;
      if (field === 'email') value = normalizeEmail(value) || null;
      if (value && value.length > MAX_LENGTH) {
        return res.status(400).json({ message: `${labels[field]} is too long.` });
      }
      const current = (field in ACCOUNT_FIELDS ? account.user[field] : account[field]) || null;
      // An email that differs only by capitals or spaces is the same email.
      const unchanged = field === 'email' ? (value ?? '') === normalizeEmail(current) : value === current;
      if (!unchanged) changes[field] = value;
    }

    let customFields: Record<string, string> | undefined;
    const customLabels: string[] = [];
    if ('customFields' in body) {
      const defs = (await getSignupForm())[kind].custom;
      const existing = (account.customFields ?? {}) as Record<string, string>;
      // Admins aren't forced to fill in a field added after this person signed up.
      const parsed = parseCustomAnswers(defs, body.customFields, { enforceRequired: false, existing });
      if (parsed.error) return res.status(400).json({ message: parsed.error });
      for (const def of defs) {
        if ((existing[def.key] ?? '') !== (parsed.answers[def.key] ?? '')) customLabels.push(def.label);
      }
      if (customLabels.length) {
        // Answers to fields no longer on the form are kept, in case the field returns.
        const kept = Object.fromEntries(Object.entries(existing).filter(([key]) => !defs.some(d => d.key === key)));
        customFields = { ...kept, ...parsed.answers };
      }
    }

    const changed = Object.keys(changes);
    if (changed.length === 0 && !customFields) {
      return res.status(200).json({ message: 'No changes to save.', account: details(kind, account) });
    }

    const invalid = await validationError(kind, changes);
    if (invalid) return res.status(400).json({ message: invalid });
    if (changes.email && await findUserByEmail(changes.email, account.user.id)) {
      return res.status(400).json({ message: 'Another account already uses this email.' });
    }

    const { email, phone, ...profile } = changes;
    const userData: Record<string, unknown> = {};
    if ('email' in changes) {
      userData.email = email;
      // A reset code already sent went to the old address, so it stops working.
      userData.resetCodeHash = null;
      userData.resetCodeExpiry = null;
    }
    if ('phone' in changes) userData.phone = phone;

    const model = prisma[kind] as any;
    const updated = await model.update({
      where: { id: account.id },
      data: {
        ...profile,
        ...(customFields ? { customFields } : {}),
        ...(Object.keys(userData).length ? { user: { update: userData } } : {})
      },
      include: { user: { select: { id: true, email: true, phone: true } } }
    });

    // The person always hears about it. Values are left out of the message
    // because some of them are bank details.
    const changedLabels = [...changed.map(f => labels[f]), ...customLabels];
    await createNotification(account.user.id, 'Your account details were updated', `UniShuttle updated your ${changedLabels.map(l => l.toLowerCase()).join(', ')}.`);
    const recipients = new Set<string>([account.user.email, updated.user.email]);
    for (const to of recipients) void sendEmail(emails.accountUpdatedByAdmin(to, updated.fullName, changedLabels));

    res.status(200).json({ message: `${updated.fullName}'s details were updated.`, account: details(kind, updated) });
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(400).json({ message: duplicateMessage(kind, error) });
    console.error(`Error updating ${kind}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getDriverAccount = getAccount('driver');
export const updateDriverAccount = updateAccount('driver');
export const getStudentAccount = getAccount('student');
export const updateStudentAccount = updateAccount('student');

const MAX_OPTION_LENGTH = 80;
const MAX_OPTIONS = 100;
const MAX_CUSTOM_FIELDS = 30;
const MAX_LABEL_LENGTH = 60;
const CUSTOM_FIELD_TYPES: CustomFieldType[] = ['text', 'number', 'phone', 'select'];

// Built from the label so that removing a field and adding it back later
// reconnects the answers people already gave.
const customFieldKey = (label: string): string =>
  `c_${crypto.createHash('sha1').update(label.trim().toLowerCase()).digest('hex').slice(0, 12)}`;

const parseCustomFields = (raw: unknown): { fields: CustomField[]; error?: string } => {
  const fields: CustomField[] = [];
  if (!Array.isArray(raw)) return { fields, error: 'Custom fields must be a list.' };
  if (raw.length > MAX_CUSTOM_FIELDS) return { fields, error: `A form can have at most ${MAX_CUSTOM_FIELDS} added fields.` };

  for (const item of raw) {
    const label = typeof item?.label === 'string' ? item.label.trim() : '';
    if (!label) return { fields, error: 'Every field needs a name.' };
    if (label.length > MAX_LABEL_LENGTH) return { fields, error: `Field names can be at most ${MAX_LABEL_LENGTH} characters.` };
    if (!CUSTOM_FIELD_TYPES.includes(item.type)) return { fields, error: 'Unknown field type.' };

    const field: CustomField = { key: customFieldKey(label), label, type: item.type, required: item.required === true };
    if (fields.some(f => f.key === field.key)) return { fields, error: `There is already a field called ${label}.` };

    if (item.type === 'select') {
      if (!Array.isArray(item.options) || item.options.some((o: unknown) => typeof o !== 'string')) {
        return { fields, error: 'Dropdown choices must be text.' };
      }
      const options = item.options.map((o: string) => o.trim()).filter(Boolean);
      if (options.length === 0) return { fields, error: 'A dropdown needs at least one choice.' };
      if (options.length > MAX_OPTIONS) return { fields, error: `A dropdown can have at most ${MAX_OPTIONS} choices.` };
      if (options.some((o: string) => o.length > MAX_OPTION_LENGTH)) return { fields, error: `Choices can be at most ${MAX_OPTION_LENGTH} characters.` };
      if (new Set(options.map((o: string) => o.toLowerCase())).size !== options.length) return { fields, error: 'A dropdown has the same choice twice.' };
      field.options = options;
    }
    fields.push(field);
  }
  return { fields };
};

// GET /api/admin/settings/signup-form — the form plus the built-in field list.
export const getAdminSignupForm = async (_req: Request, res: Response) => {
  try {
    const [options, form] = await Promise.all([getSignupOptions(), getSignupForm()]);
    res.status(200).json({ options, ...form, fields: SIGNUP_FIELDS });
  } catch (error) {
    console.error('Error fetching sign-up form:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/admin/settings/signup-form — { kind, hidden?, custom? }
export const updateSignupForm = async (req: Request, res: Response) => {
  try {
    const { kind, hidden, custom } = req.body ?? {};
    if (kind !== 'student' && kind !== 'driver') return res.status(400).json({ message: 'Unknown form.' });
    const form = await getSignupForm();

    if (hidden !== undefined) {
      if (!Array.isArray(hidden)) return res.status(400).json({ message: 'Removed fields must be a list.' });
      const builtIn = SIGNUP_FIELDS[kind as FormKind];
      for (const name of hidden) {
        const field = builtIn.find(f => f.name === name);
        if (!field) return res.status(400).json({ message: 'Unknown field.' });
        if (field.locked) return res.status(400).json({ message: `${field.label} can't be removed because the app depends on it.` });
      }
      form[kind as FormKind].hidden = [...new Set<string>(hidden)];
    }

    if (custom !== undefined) {
      const parsed = parseCustomFields(custom);
      if (parsed.error) return res.status(400).json({ message: parsed.error });
      form[kind as FormKind].custom = parsed.fields;
    }

    await setSignupForm(form);
    res.status(200).json({ message: 'Sign-up form updated.', form: form[kind as FormKind] });
  } catch (error) {
    console.error('Error updating sign-up form:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/admin/settings/signup-options — body holds only the lists being
// changed, so two admins working on different lists don't overwrite each other.
export const updateSignupOptions = async (req: Request, res: Response) => {
  try {
    const body = req.body ?? {};
    const options = await getSignupOptions();

    for (const list of Object.keys(body)) {
      if (!SIGNUP_OPTION_LISTS.includes(list as SignupOptionList)) {
        return res.status(400).json({ message: `Unknown list: ${list}` });
      }
      const raw = body[list];
      if (!Array.isArray(raw) || raw.some(item => typeof item !== 'string')) {
        return res.status(400).json({ message: 'Each list must be a list of text values.' });
      }
      const items = raw.map((item: string) => item.trim()).filter(Boolean);
      if (items.length === 0) return res.status(400).json({ message: 'Keep at least one option in the list.' });
      if (items.length > MAX_OPTIONS) return res.status(400).json({ message: `A list can hold at most ${MAX_OPTIONS} options.` });
      if (items.some(item => item.length > MAX_OPTION_LENGTH)) {
        return res.status(400).json({ message: `Options can be at most ${MAX_OPTION_LENGTH} characters.` });
      }
      if (new Set(items.map(item => item.toLowerCase())).size !== items.length) {
        return res.status(400).json({ message: 'That option is already on the list.' });
      }
      options[list as SignupOptionList] = items;
    }

    await setSignupOptions(options);
    res.status(200).json({ message: 'Sign-up form updated.', options });
  } catch (error) {
    console.error('Error updating sign-up options:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
