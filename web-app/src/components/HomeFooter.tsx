'use client';
import Link from 'next/link';
import { business } from '../lib/business';
import { BrandMark, BrandWordmark } from './Brand';
import { useT } from '../lib/useLang';

// Footer for the public pages.
export default function HomeFooter() {
  const t = useT();
  const address = business.address;
  return (
    <footer className="h-footer">
      <div className="h-wrap">
        <div className="h-footer-grid">
          <div>
            <div className="h-footer-brand">
              <BrandMark height={30} />
              <BrandWordmark height={20} />
            </div>
            <p>{t("University bus travel in Sri Lanka, made simple for students and drivers.")}</p>
          </div>
          <div>
            <h4>{t("Site")}</h4>
            <div className="h-footer-links">
              <Link href="/">{t("Home")}</Link>
              <Link href="/how-it-works">{t("How it works")}</Link>
              <Link href="/contact">{t("Contact us")}</Link>
            </div>
          </div>
          <div>
            <h4>{t("Your account")}</h4>
            <div className="h-footer-links">
              <Link href="/login">{t("Sign in")}</Link>
              <Link href="/signup">{t("Create an account")}</Link>
              <Link href="/portal/forgot-password">{t("Forgot password")}</Link>
            </div>
          </div>
          <div>
            <h4>{t("Get in touch")}</h4>
            <div className="h-footer-links">
              <a href={`mailto:${business.email}`}>{business.email}</a>
              <a href={`tel:${business.phoneHref}`}>{business.phone}</a>
              <span>{address.line1}<br />{address.city}, {address.country}</span>
            </div>
          </div>
        </div>
        <div className="h-footer-bottom">© {new Date().getFullYear()} {business.name}{t(". All rights reserved.")}</div>
      </div>
    </footer>
  );
}
