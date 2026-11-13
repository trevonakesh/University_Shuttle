'use client';
import { ReactNode, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { BrandMark, BrandWordmark } from './Brand';

export interface PortalNavItem { href: string; label: string; icon: ReactNode }

interface Props {
  homeHref: string;
  roleLabel: string;
  roleColor?: string;
  navItems: PortalNavItem[];
  signedInAs: ReactNode;
  onLogout: () => void;
  children: ReactNode;
}

// The frame for the student and driver portals. On a computer the menu is a
// sidebar; on a phone it is hidden behind a top bar and slides in from the left.
export default function PortalShell({ homeHref, roleLabel, roleColor, navItems, signedInAs, onLogout, children }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const current = navItems.find(item => item.href === pathname);

  // Close the menu after moving to another page.
  useEffect(() => { setOpen(false); }, [pathname]);

  // While the phone menu is open: Escape closes it and the page behind stays still.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  return (
    <div className="portal">
      <header className="portal-topbar">
        <Link href={homeHref} className="portal-topbar-brand" aria-label="Dashboard">
          <BrandMark height={26} />
        </Link>
        <span className="portal-topbar-title">{current?.label ?? roleLabel}</span>
        <button
          className="portal-menu-btn"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="portal-menu"
          onClick={() => setOpen(v => !v)}
        >
          <svg width="22" height="18" viewBox="0 0 22 18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <path d={open ? 'M3 2l16 14M19 2L3 16' : 'M1 2h20M1 9h20M1 16h20'} />
          </svg>
        </button>
      </header>

      <div className={`portal-backdrop${open ? ' open' : ''}`} onClick={() => setOpen(false)} aria-hidden="true" />

      <div className="portal-shell">
        <aside id="portal-menu" className={`portal-sidebar${open ? ' open' : ''}`}>
          <Link href={homeHref} className="portal-brand">
            <BrandMark height={26} />
            <BrandWordmark height={17} />
          </Link>
          <div className="portal-role-badge" style={roleColor ? { color: roleColor } : undefined}>{roleLabel}</div>
          <nav className="portal-nav" aria-label={roleLabel}>
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={pathname === item.href ? 'active' : ''}
                aria-current={pathname === item.href ? 'page' : undefined}
                onClick={() => setOpen(false)}
              >
                {item.icon}{item.label}
              </Link>
            ))}
          </nav>
          <div className="portal-spacer" />
          <div className="portal-signed-in">{signedInAs}</div>
          <button className="portal-logout" onClick={onLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign Out
          </button>
        </aside>
        <main className="portal-main">{children}</main>
      </div>
    </div>
  );
}
