import { si } from './si';

// English / Sinhala for the public pages and the student and driver portals.
// The English text itself is the key: anything missing from the Sinhala
// dictionary simply shows in English. The choice lives in a cookie so pages
// are drawn on the server in the right language, with no flash of English.
export type Lang = 'en' | 'si';
export const LANG_COOKIE = 'us-lang';

export const parseLang = (value?: string | null): Lang => (value === 'si' ? 'si' : 'en');

export type Vars = Record<string, string | number | null | undefined>;
export type TFn = (text: string, vars?: Vars) => string;

// `vars` fill {name} slots, so word order can differ between the languages.
export function translate(lang: Lang, text: string, vars?: Vars): string {
  if (typeof text !== 'string') return text;
  let out = lang === 'si' ? si[text] ?? text : text;
  if (vars) out = out.replace(/\{(\w+)\}/g, (_, key: string) => (vars[key] == null ? '' : String(vars[key])));
  return out;
}

// Dates in the visitor's language. Sinhala month names are spelled out here
// because many browsers and phones carry no Sinhala date data of their own.
const SI_MONTHS = ['ජනවාරි', 'පෙබරවාරි', 'මාර්තු', 'අප්‍රේල්', 'මැයි', 'ජූනි', 'ජූලි', 'අගෝස්තු', 'සැප්තැම්බර්', 'ඔක්තෝබර්', 'නොවැම්බර්', 'දෙසැම්බර්'];
const EN_FORMATS: Record<DateStyle, Intl.DateTimeFormatOptions> = {
  month: { month: 'long', year: 'numeric' },
  day: { month: 'short', day: 'numeric', year: 'numeric' },
  dayTime: { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }
};
export type DateStyle = 'month' | 'day' | 'dayTime';

export function formatDate(value: string | number | Date, lang: Lang, style: DateStyle): string {
  const d = new Date(value);
  if (lang !== 'si') return d.toLocaleString('en-US', EN_FORMATS[style]);
  const month = `${d.getFullYear()} ${SI_MONTHS[d.getMonth()]}`;
  if (style === 'month') return month;
  const day = `${month} ${d.getDate()}`;
  if (style === 'day') return day;
  return `${day}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
