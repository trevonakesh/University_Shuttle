'use client';
import { useEffect, useState } from 'react';
import { THEME_KEY } from './theme';

export type Theme = 'light' | 'dark';

// The current light / dark choice and a function to flip it. The choice is
// the data-theme attribute on <html> (applied before first paint by the root
// layout) and is remembered on this device, for the public pages and portals alike.
export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    if (document.documentElement.getAttribute('data-theme') === 'dark') setTheme('dark');
  }, []);

  const toggle = () => {
    const next: Theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem(THEME_KEY, next); } catch { /* private window: applies to this visit only */ }
  };

  return [theme, toggle];
}

export const SunIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4.2" /><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
  </svg>
);

export const MoonIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 14.5A8.5 8.5 0 019.5 4a7 7 0 1010.5 10.5z" />
  </svg>
);
