'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BrandMark, BrandWordmark } from './Brand';
import { THEME_KEY } from '../lib/theme';

type Theme = 'light' | 'dark';

const links = [
  { href: '/how-it-works', label: 'How it works' },
  { href: '/contact', label: 'Contact' },
  { href: '/login', label: 'Sign in' }
];

// Header for the public pages, with the light / dark switch. The theme is a
// data-theme attribute on <html>, applied before first paint by the script in
// the root layout and remembered on this device.
export default function HomeNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    if (document.documentElement.getAttribute('data-theme') === 'dark') setTheme('dark');
  }, []);

  const switchTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem(THEME_KEY, next); } catch { /* private window: applies to this visit only */ }
  };

  return (
    <header className="h-header">
      <div className="h-wrap h-header-inner">
        <Link href="/" className="h-brand" aria-label="UniShuttle home">
          <span className="h-only-light"><BrandMark height={32} tone="light" /></span>
          <span className="h-only-dark"><BrandMark height={32} /></span>
          <BrandWordmark height={21} color="currentColor" />
        </Link>

        <button
          className="h-icon-btn h-theme"
          onClick={switchTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {theme === 'dark'
              ? <><circle cx="12" cy="12" r="4.2" /><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" /></>
              : <path d="M20 14.5A8.5 8.5 0 019.5 4a7 7 0 1010.5 10.5z" />}
          </svg>
        </button>

        <button className="h-icon-btn h-menu" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(v => !v)}>
          <svg width="22" height="16" viewBox="0 0 22 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <path d={open ? 'M3 1l16 14M19 1L3 15' : 'M1 1h20M1 8h20M1 15h20'} />
          </svg>
        </button>

        <nav className={`h-nav${open ? ' open' : ''}`} onClick={() => setOpen(false)}>
          {links.map(l => (
            <Link key={l.href} href={l.href} className={pathname === l.href ? 'current' : undefined} aria-current={pathname === l.href ? 'page' : undefined}>
              {l.label}
            </Link>
          ))}
          <Link href="/signup" className="h-btn primary small">Get started</Link>
        </nav>
      </div>
    </header>
  );
}
