import './globals.css';
import Link from 'next/link';
import { ReactNode } from 'react';

export const metadata = {
  title: 'Uni Shuttle Admin Panel',
  description: 'Manage drivers, students, and payments',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="admin-layout">
          <aside className="sidebar">
            <div className="sidebar-logo">Uni Shuttle Admin</div>
            <Link href="/" className="nav-link">Drivers</Link>
            <Link href="/students" className="nav-link">Students</Link>
            <Link href="/payments" className="nav-link">Payments</Link>
            <Link href="/earnings" className="nav-link">Earnings</Link>
          </aside>
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
