// All fare deadlines are evaluated in Sri Lanka time (Asia/Colombo, UTC+5:30,
// no DST), regardless of the server's or client's timezone.
const COLOMBO_OFFSET_MS = 5.5 * 60 * 60 * 1000;

// Day of month after which an unpaid current-month fare freezes the account.
export const FREEZE_DAY = 10;

// A Date whose UTC getters yield Colombo wall-clock time.
const colomboNow = (): Date => new Date(Date.now() + COLOMBO_OFFSET_MS);

export const currentMonth = (): string => {
  const d = colomboNow();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};

export const currentDay = (): number => colomboNow().getUTCDate();

// Month + day-of-month of an arbitrary timestamp, in Colombo time.
export const colomboMonthAndDay = (date: Date): { month: string; day: number } => {
  const d = new Date(date.getTime() + COLOMBO_OFFSET_MS);
  return {
    month: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`,
    day: d.getUTCDate()
  };
};

export const isValidMonth = (month: unknown): month is string =>
  typeof month === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(month);
