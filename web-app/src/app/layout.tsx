import './globals.css';
import { ReactNode } from 'react';
import AdminShell from '../components/AdminShell';

export const metadata = {
  title: 'UniShuttle',
  description: 'University bus travel in Sri Lanka, organised in one app.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
