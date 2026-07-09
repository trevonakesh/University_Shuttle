import './globals.css';
import { ReactNode } from 'react';
import AdminShell from '../components/AdminShell';

export const metadata = {
  title: 'Uni Shuttle Admin Panel',
  description: 'Manage drivers, students, and payments',
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
