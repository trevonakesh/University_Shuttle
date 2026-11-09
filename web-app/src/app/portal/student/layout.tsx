'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { getPortalUser, clearPortalToken } from '../../../lib/portalApi';
import { BrandMark, BrandWordmark } from '../../../components/Brand';
import '../portal.css';

const navItems = [
  { href: '/portal/student', label: 'Dashboard', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> },
  { href: '/portal/student/buses', label: 'Find a Bus', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> },
  { href: '/portal/student/daily', label: 'Daily Rides', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
  { href: '/portal/student/tracking', label: 'Live Tracking', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> },
  { href: '/portal/student/fare', label: 'My Fare', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> },
  { href: '/portal/student/payments', label: 'Payments', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
  { href: '/portal/student/notices', label: 'Notices', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
  { href: '/portal/student/profile', label: 'Profile', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const u = getPortalUser();
    if (!u || u.role !== 'STUDENT') {
      window.location.href = '/login';
    } else {
      setUser(u);
    }
  }, []);

  const logout = () => {
    clearPortalToken();
    window.location.href = '/login';
  };

  if (!user) return null;

  return (
    <div className="portal">
      <div className="portal-shell">
        <aside className="portal-sidebar">
          <Link href="/portal/student" className="portal-brand">
            <BrandMark height={26} />
            <BrandWordmark height={17} />
          </Link>
          <div className="portal-role-badge">Student Portal</div>
          <nav className="portal-nav">
            {navItems.map(item => (
              <Link key={item.href} href={item.href} className={pathname === item.href ? 'active' : ''}>
                {item.icon}{item.label}
              </Link>
            ))}
          </nav>
          <div className="portal-spacer" />
          <div style={{ padding: '0 10px 8px', fontSize: '12px', color: 'rgba(255,255,255,.35)', lineHeight: 1.4 }}>
            Signed in as<br />
            <span style={{ color: 'rgba(255,255,255,.6)', fontWeight: 500 }}>{user.profile?.fullName ?? user.email}</span>
          </div>
          <button className="portal-logout" onClick={logout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign Out
          </button>
        </aside>
        <main className="portal-main">{children}</main>
      </div>
    </div>
  );
}
