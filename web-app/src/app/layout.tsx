import './globals.css';
import { ReactNode } from 'react';
import AdminShell from '../components/AdminShell';
import { PageLoader } from '../components/Brand';
import { THEME_SCRIPT } from '../lib/theme';
import { sinhalaFont } from '../lib/fonts';
import { getLang } from '../lib/i18n-server';
import { LangProvider } from '../lib/useLang';

export const metadata = {
  title: 'UniShuttle',
  description: 'University bus travel in Sri Lanka, organised in one app.',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // English or Sinhala, from the visitor's cookie.
  const lang = await getLang();
  return (
    // The theme script below may add data-theme to <html> before React starts.
    <html lang={lang} className={sinhalaFont.variable} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <LangProvider initial={lang}>
          <PageLoader />
          <AdminShell>{children}</AdminShell>
        </LangProvider>
      </body>
    </html>
  );
}
