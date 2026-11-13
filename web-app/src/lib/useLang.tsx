'use client';
import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LANG_COOKIE, translate, type Lang, type TFn } from './i18n';

const LangContext = createContext<{ lang: Lang; setLang: (lang: Lang) => void }>({ lang: 'en', setLang: () => {} });

// Wraps the whole site (root layout). `initial` comes from the cookie on the server.
export function LangProvider({ initial, children }: { initial: Lang; children: ReactNode }) {
  const router = useRouter();
  const [lang, setLangState] = useState<Lang>(initial);
  const [seenInitial, setSeenInitial] = useState<Lang>(initial);

  // A fresh server render (after a refresh) wins over the local choice.
  if (initial !== seenInitial) {
    setSeenInitial(initial);
    setLangState(initial);
  }

  const setLang = useCallback((next: Lang) => {
    // Remembered for a year on this device. The client parts switch at once;
    // the refresh redraws the server-drawn parts in the new language.
    document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = next;
    setLangState(next);
    router.refresh();
  }, [router]);

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext).lang;

// t('English text') gives the text in the visitor's language.
export function useT(): TFn {
  const lang = useLang();
  return useCallback((text, vars) => translate(lang, text, vars), [lang]);
}

// A button that flips between English and Sinhala. It shows the language you
// would switch to, written in that language, so anyone can find it.
export function LangSwitch({ className }: { className?: string }) {
  const { lang, setLang } = useContext(LangContext);
  const next: Lang = lang === 'si' ? 'en' : 'si';
  return (
    <button
      type="button"
      className={className}
      onClick={() => setLang(next)}
      lang={next}
      aria-label={next === 'si' ? 'සිංහලෙන් බලන්න' : 'View in English'}
      title={next === 'si' ? 'සිංහලෙන් බලන්න' : 'View in English'}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9.5" /><path d="M2.5 12h19M12 2.5c2.6 2.7 3.9 5.9 3.9 9.5s-1.3 6.8-3.9 9.5c-2.6-2.7-3.9-5.9-3.9-9.5s1.3-6.8 3.9-9.5z" />
      </svg>
      <span>{next === 'si' ? 'සිංහල' : 'English'}</span>
    </button>
  );
}
