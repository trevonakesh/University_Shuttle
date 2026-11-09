'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, ReactNode } from 'react';
import { business } from '../lib/business';
import { fontVariables } from '../lib/fonts';
import { BrandMark, BrandWordmark } from './Brand';
import '../app/site.css';

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
        <Link href="/" className="brand" aria-label={business.name}>
          <BrandMark height={30} />
          <BrandWordmark height={21} />
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
          <Link href="/login">Sign in</Link>
          <Link href="/signup" className="btn-cta">Get started</Link>
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
              <BrandMark height={30} />
              <BrandWordmark height={21} />
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
              <Link href="/login">Sign in</Link>
              <Link href="/signup">Create an account</Link>
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
        </div>
      </div>
    </footer>
  );
}

export default function SiteChrome({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  // Reveals sections as they scroll in, and moves the light on cards with the pointer.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.classList.add('js');

    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      }
    }, { rootMargin: '0px 0px -8% 0px' });
    root.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    const onMove = (e: PointerEvent) => {
      const card = (e.target as Element).closest<HTMLElement>('.card');
      if (!card) return;
      const box = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - box.left}px`);
      card.style.setProperty('--my', `${e.clientY - box.top}px`);
    };
    root.addEventListener('pointermove', onMove);

    return () => {
      observer.disconnect();
      root.removeEventListener('pointermove', onMove);
    };
  }, []);

  return (
    <div className={`site ${fontVariables}`} ref={rootRef}>
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
