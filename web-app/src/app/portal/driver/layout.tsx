'use client';
import { useEffect, useState } from 'react';
import { getPortalUser, setPortalUser, clearPortalToken, portalFetch } from '../../../lib/portalApi';
import PortalShell from '../../../components/PortalShell';
import '../portal.css';
import { useT } from '../../../lib/useLang';

const navItems = [
  {
    href: '/portal/driver',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
      </svg>
    )
  },
  {
    href: '/portal/driver/fares',
    label: 'Monthly Fares',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><path d="M7 15h2M12 15h5"/>
      </svg>
    )
  },
  {
    href: '/portal/driver/requests',
    label: 'Seat & Daily Requests',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
      </svg>
    )
  },
  {
    href: '/portal/driver/tracking',
    label: 'Live Location',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
  },
  {
    href: '/portal/driver/wallet',
    label: 'Wallet & Payouts',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><circle cx="16" cy="14" r="1"/>
      </svg>
    )
  },
  {
    href: '/portal/driver/notices',
    label: 'Notices & Polls',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    )
  },
  {
    href: '/portal/driver/profile',
    label: 'Bus Profile',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v4h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    )
  }
];

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const t = useT();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const u = getPortalUser();
    if (!u || u.role !== 'DRIVER') {
      window.location.href = '/login';
    } else {
      setUser(u);
      // The saved copy can be out of date, e.g. after the admin approves the bus.
      portalFetch('/api/auth/me').then(r => r.json()).then(d => {
        if (d.user) {
          setPortalUser(d.user);
          setUser(d.user);
        }
      }).catch(() => {});
    }
  }, []);

  const logout = () => {
    clearPortalToken();
    window.location.href = '/login';
  };

  if (!user) return null;

  const profile = user.profile || {};

  return (
    <PortalShell
      homeHref="/portal/driver"
      roleLabel="Driver Operator"
      roleColor="var(--amber)"
      navItems={navItems}
      onLogout={logout}
      signedInAs={
        <>
          {t("Signed in as")}<br />
          <b>{profile.fullName ?? user.email}</b>
          {profile.busRegNumber && <div className="portal-signed-in-bus">{t("Bus:")} {profile.busRegNumber}</div>}
        </>
      }
    >
      {profile.status && profile.status !== 'APPROVED' && (
        <div className="p-alert amber" style={{ marginBottom: '20px' }}>
          {profile.status === 'PENDING'
            ? t("Your driver application is being reviewed. Students can see your bus once an administrator approves it.")
            : t("Your driver application was not approved. Please contact support for help.")}
        </div>
      )}
      {children}
    </PortalShell>
  );
}
