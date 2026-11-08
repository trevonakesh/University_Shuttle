'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { getToken, clearToken, ADMIN_LOGIN_PATH } from '../lib/api';

// Only /admin/* is gated. Public pages and the admin login page render bare.
export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === ADMIN_LOGIN_PATH;
  const isAdmin = !isLoginPage && (pathname?.startsWith('/admin') ?? false);

  useEffect(() => {
    if (isAdmin && !getToken()) {
      window.location.href = ADMIN_LOGIN_PATH;
    }
  }, [isAdmin]);

  if (!isAdmin) return <>{children}</>;

  const logout = () => {
    clearToken();
    window.location.href = ADMIN_LOGIN_PATH;
  };

  const navItems = [
    { href: '/admin', label: 'Drivers' },
    { href: '/admin/students', label: 'Students' },
    { href: '/admin/payments', label: 'Payments' },
    { href: '/admin/earnings', label: 'Earnings' },
    { href: '/admin/messages', label: 'Enquiries' }
  ];

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">Uni Shuttle Admin</div>
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-link${pathname === item.href ? ' active' : ''}`}
          >
            {item.label}
          </Link>
        ))}
        <div style={{ flex: 1 }} />
        <Link href="/" className="nav-link" style={{ fontSize: '13px' }}>← View public site</Link>
        <button className="btn btn-outline" onClick={logout}>Log Out</button>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
