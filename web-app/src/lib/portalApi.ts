import { translate, type TFn } from './i18n';
export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

const KEY = 'unishuttle_portal_token';
const USER_KEY = 'unishuttle_portal_user';

export const getPortalToken = (): string | null =>
  typeof window === 'undefined' ? null : localStorage.getItem(KEY);

export const setPortalToken = (token: string) => localStorage.setItem(KEY, token);
export const clearPortalToken = () => { localStorage.removeItem(KEY); localStorage.removeItem(USER_KEY); };

export const getPortalUser = (): any => {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; }
};
export const setPortalUser = (user: any) => localStorage.setItem(USER_KEY, JSON.stringify(user));

// Today in Sri Lanka as YYYY-MM-DD, matching how the server dates rides.
export const colomboToday = (): string =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Colombo' });

// Plain-language reason for a frozen account, from GET /api/fares/me.
export const freezeMessage = (fare: any, t: TFn = (text, vars) => translate('en', text, vars)): string => {
  const settle = t(fare?.onlinePayments
    ? 'Pay the fare to unfreeze it.'
    : 'Hand the fare to your driver and ask them to mark it as paid to unfreeze it.');
  return fare?.freezeReason === 'EXEMPT'
    ? `${t('Your driver marked you as not travelling in {month}, so your account is frozen this month. Planning to travel?', { month: fare.month })} ${settle}`
    : `${t("Your {month} fare wasn't paid by the {day}, so your account is frozen.", { month: fare?.month, day: t('{n}th', { n: fare?.dueDay }) })} ${settle}`;
};

export const portalFetch = async (path: string, init: RequestInit = {}): Promise<Response> => {
  const token = getPortalToken();
  if (!token) {
    window.location.href = '/login';
    throw new Error('Not logged in');
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
      Authorization: `Bearer ${token}`
    }
  });
  // Only 401 means the session itself is gone. A 403 is a refusal of this one
  // action (e.g. ACCOUNT_FROZEN, "not your request") and is left for the page
  // to show; logging out there would hide the reason from the user.
  if (res.status === 401) {
    clearPortalToken();
    window.location.href = '/login';
    throw new Error('Session expired');
  }
  return res;
};
