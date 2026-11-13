import { ReactNode } from 'react';
import HomeNav from './HomeNav';
import HomeFooter from './HomeFooter';
import { homeFontVariables } from '../lib/fonts';
import '../app/home.css';

// The frame every public page shares: header with the light / dark switch,
// the page, and the footer. Sign-in pages leave the footer out.
export default function PublicShell({ children, footer = true }: { children: ReactNode; footer?: boolean }) {
  return (
    <div className={`home ${homeFontVariables}`}>
      <HomeNav />
      <main>{children}</main>
      {footer && <HomeFooter />}
    </div>
  );
}
