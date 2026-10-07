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

const socialIcon = (name: string) => {
  switch (name) {
    case 'Facebook':
      return <path d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H9v3h2v7h3v-7h2.5l.5-3H14V9.5c0-.3.2-.5.5-.5H14z" />;
    case 'Instagram':
      return (
        <>
          <rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="3.8" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="17" cy="7" r="1.2" />
        </>
      );
    case 'LinkedIn':
      return <path d="M5.5 8.5h2.7V19H5.5V8.5zM6.85 4a1.6 1.6 0 110 3.2 1.6 1.6 0 010-3.2zM10.6 8.5h2.6v1.4h.04c.36-.66 1.25-1.4 2.57-1.4 2.75 0 3.26 1.7 3.26 3.94V19h-2.72v-4.9c0-1.17-.02-2.68-1.7-2.68-1.7 0-1.96 1.28-1.96 2.6V19H10.6V8.5z" />;
    default:
      return (
        <>
          <rect x="2.5" y="5.5" width="19" height="13" rx="3.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M10.2 9.4l5 2.6-5 2.6V9.4z" />
        </>
      );
  }
};

const links = [
  { href: '/', label: 'Home' },
  { href: '/services', label: 'Services' },
  { href: '/pricing', label: 'Pricing' },
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
          <Link href="/pricing" className="btn-cta" style={{ marginLeft: 8 }}>Get started</Link>
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
              Prepaid university bus travel with live tracking, digital fares and
              verified operators.
            </p>
            <div className="socials">
              {business.socials.map(s => (
                <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.name} title={s.name}>
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">{socialIcon(s.name)}</svg>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4>Company</h4>
            <div className="footer-links">
              <Link href="/">Home</Link>
              <Link href="/services">Services</Link>
              <Link href="/pricing">Pricing</Link>
              <Link href="/contact">Contact us</Link>
            </div>
          </div>

          <div>
            <h4>For operators</h4>
            <div className="footer-links">
              <Link href="/services">What we offer</Link>
              <Link href="/pricing">Partner plan</Link>
              <Link href="/contact">Become a partner</Link>
              <Link href="/admin">Operator admin</Link>
            </div>
          </div>

          <div>
            <h4>Get in touch</h4>
            <div className="footer-links">
              <a href={`mailto:${business.email}`}>{business.email}</a>
              <a href={`tel:${business.phoneHref}`}>{business.phone}</a>
              <span style={{ lineHeight: 1.6 }}>
                {a.line1}<br />
                {a.suburb} {a.state} {a.postcode}<br />
                {a.country}
              </span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {business.legalName}. All rights reserved.</span>
          <span className="abn-badge">ABN <b>{business.abn}</b></span>
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
