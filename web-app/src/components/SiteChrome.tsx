'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, ReactNode } from 'react';
import { business } from '../lib/business';
import '../app/site.css';

const BusMark = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="13" rx="2.5" />
    <path d="M3 10.5h18" />
    <path d="M7 17v2.2M17 17v2.2" />
    <circle cx="7.6" cy="13.8" r=".9" fill="currentColor" stroke="none" />
    <circle cx="16.4" cy="13.8" r=".9" fill="currentColor" stroke="none" />
  </svg>
);

const links = [
  { href: '/', label: 'Home' },
  { href: '/how-it-works', label: 'How it works' },
  { href: '/contact', label: 'Contact' }
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="wrap site-header-inner">
        <Link href="/" className="brand">
          <span className="brand-mark"><BusMark /></span>
          {business.name}
        </Link>

        <button
          className="nav-toggle"
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen(v => !v)}
        >
          <svg width="20" height="14" viewBox="0 0 20 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M1 1h18M1 7h18M1 13h18" />
          </svg>
        </button>

        <nav className={`site-nav${open ? ' open' : ''}`} onClick={() => setOpen(false)}>
          {links.map(l => (
            <Link key={l.href} href={l.href} className={pathname === l.href ? 'current' : ''}>
              {l.label}
            </Link>
          ))}
          <Link href="/login" style={{ color: '#0e7c66', fontWeight: 600, marginLeft: 8 }}>Portal Login</Link>
          <Link href="/contact" className="btn-cta" style={{ marginLeft: 8 }}>Get in touch</Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const a = business.address;
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">
              <span className="brand-mark"><BusMark /></span>
              {business.name}
            </div>
            <p className="footer-about">
              Seat requests, attendance polls, monthly fares and live bus tracking
              for university students and private bus operators in Sri Lanka.
            </p>
          </div>

          <div>
            <h4>Site</h4>
            <div className="footer-links">
              <Link href="/">Home</Link>
              <Link href="/how-it-works">How it works</Link>
              <Link href="/contact">Contact us</Link>
            </div>
          </div>

          <div>
            <h4>Platform</h4>
            <div className="footer-links">
              <Link href="/login" style={{ fontWeight: 600, color: '#0e7c66' }}>Student & Driver Portal</Link>
              <Link href="/how-it-works#students">For students</Link>
              <Link href="/how-it-works#drivers">For drivers</Link>
            </div>
          </div>

          <div>
            <h4>Get in touch</h4>
            <div className="footer-links">
              <a href={`mailto:${business.email}`}>{business.email}</a>
              <a href={`tel:${business.phoneHref}`}>{business.phone}</a>
              <span style={{ lineHeight: 1.6 }}>
                {a.line1}<br />
                {a.city}, {a.country}
              </span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {business.name}. All rights reserved.</span>
          <span>Payments processed securely by PayHere</span>
        </div>
      </div>
    </footer>
  );
}

export default function SiteChrome({ children }: { children: ReactNode }) {
  return (
    <div className="site">
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
