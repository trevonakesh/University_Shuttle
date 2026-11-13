import { cookies } from 'next/headers';
import { LANG_COOKIE, parseLang, translate, type Lang, type TFn } from './i18n';

// For server components: the visitor's language, from the cookie.
export async function getLang(): Promise<Lang> {
  return parseLang((await cookies()).get(LANG_COOKIE)?.value);
}

export async function getT(): Promise<TFn> {
  const lang = await getLang();
  return (text, vars) => translate(lang, text, vars);
}
