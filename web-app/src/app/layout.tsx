import './globals.css';
import { ReactNode } from 'react';
import AdminShell from '../components/AdminShell';
import { PageLoader } from '../components/Brand';
import { THEME_SCRIPT } from '../lib/theme';

export const metadata = {
  title: 'UniShuttle',
  description: 'University bus travel in Sri Lanka, organised in one app.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // The theme script below may add data-theme to <html> before React starts.
    <html lang="en" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <PageLoader />
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
