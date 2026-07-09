'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { getToken, clearToken } from '../lib/api';

// Wraps every page: the login page renders bare, everything else gets the
// sidebar and requires a stored admin token.
export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === '/login';

  useEffect(() => {
    if (!isLogin && !getToken()) {
      window.location.href = '/login';
    }
  }, [isLogin]);

  if (isLogin) return <>{children}</>;

  const logout = () => {
    clearToken();
    window.location.href = '/login';
  };

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">Uni Shuttle Admin</div>
        <Link href="/" className="nav-link">Drivers</Link>
        <Link href="/students" className="nav-link">Students</Link>
        <Link href="/payments" className="nav-link">Payments</Link>
        <Link href="/earnings" className="nav-link">Earnings</Link>
        <div style={{ flex: 1 }} />
        <button className="btn btn-outline" onClick={logout}>Log Out</button>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
