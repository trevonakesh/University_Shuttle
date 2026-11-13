'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BrandMark, BrandWordmark } from './Brand';

export const THEME_KEY = 'us-home-theme';
type Theme = 'light' | 'dark';

// Header for the home page, with the light / dark switch. The chosen theme is
// an attribute on the page's .home element (set before first paint by the
// script in page.tsx) and is remembered on this device.
export default function HomeNav() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>('light');

  // The script in page.tsx has usually applied the saved choice already. It
  // doesn't run when the page is reached by an in-site link, so apply it here too.
  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch { /* storage blocked */ }
    if (saved !== 'dark') return;
    document.querySelector('.home')?.setAttribute('data-theme', 'dark');
    setTheme('dark');
  }, []);

  const switchTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.querySelector('.home')?.setAttribute('data-theme', next);
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
              ? <><circle cx="12" cy="12" r="4.2" /><path d="M12 2.5v2.2M12 19.300v2.200M2.500 12h2.200M19.300 12h2.200M5.300 5.300l1.600 1.600M17.100 17.100l1.600 1.600M5.300 18.700l1.600-1.600M17.100 6.900l1.600-1.600" /></>
              : <path d="M20 14.500A8.500 8.500 0 019.500 4a7 7 0 1010.500 10.500z" />}
          </svg>
        </button>

        <button className="h-icon-btn h-menu" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(v => !v)}>
          <svg width="22" height="16" viewBox="0 0 22 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <path d={open ? 'M3 1l16 14M19 1L3 15' : 'M1 1h20M1 8h20M1 15h20'} />
          </svg>
        </button>

        <nav className={`h-nav${open ? ' open' : ''}`} onClick={() => setOpen(false)}>
          <Link href="/how-it-works">How it works</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/login">Sign in</Link>
          <Link href="/signup" className="h-btn primary small">Get started</Link>
        </nav>
      </div>
    </header>
  );
}
