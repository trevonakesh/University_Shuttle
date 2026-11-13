'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { BrandMark, BrandWordmark } from './Brand';
import { MoonIcon, SunIcon, useTheme } from '../lib/useTheme';
import { LangSwitch, useT } from '../lib/useLang';

const links = [
  { href: '/how-it-works', label: 'How it works' },
  { href: '/contact', label: 'Contact' },
  { href: '/login', label: 'Sign in' }
];

// Header for the public pages, with the light / dark switch. The theme is a
// data-theme attribute on <html>, applied before first paint by the script in
// the root layout and remembered on this device.
export default function HomeNav() {
  const t = useT();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [theme, switchTheme] = useTheme();

  return (
    <header className="h-header">
      <div className="h-wrap h-header-inner">
        <Link href="/" className="h-brand" aria-label={t("UniShuttle home")}>
          <span className="h-only-light"><BrandMark height={32} tone="light" /></span>
          <span className="h-only-dark"><BrandMark height={32} /></span>
          <BrandWordmark height={21} color="currentColor" />
        </Link>

        <LangSwitch className="h-icon-btn h-lang" />

        <button
          className="h-icon-btn h-theme"
          onClick={switchTheme}
          aria-label={theme === 'dark' ? t("Switch to light mode") : t("Switch to dark mode")}
          title={theme === 'dark' ? t("Light mode") : t("Dark mode")}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>

        <button className="h-icon-btn h-menu" aria-label={t("Menu")} aria-expanded={open} onClick={() => setOpen(v => !v)}>
          <svg width="22" height="16" viewBox="0 0 22 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <path d={open ? 'M3 1l16 14M19 1L3 15' : 'M1 1h20M1 8h20M1 15h20'} />
          </svg>
        </button>

        <nav className={`h-nav${open ? ' open' : ''}`} onClick={() => setOpen(false)}>
          {links.map(l => (
            <Link key={l.href} href={l.href} className={pathname === l.href ? 'current' : undefined} aria-current={pathname === l.href ? 'page' : undefined}>
              {t(l.label)}
            </Link>
          ))}
          <Link href="/signup" className="h-btn primary small">{t("Get started")}</Link>
        </nav>
      </div>
    </header>
  );
}
