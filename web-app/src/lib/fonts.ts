import { Fredoka, Noto_Sans_Sinhala, Nunito } from 'next/font/google';

// The public pages: rounded, friendly type that matches the logo's curves.
const homeDisplay = Fredoka({ subsets: ['latin'], variable: '--font-home-display', display: 'swap' });
const homeBody = Nunito({ subsets: ['latin'], variable: '--font-home-body', display: 'swap' });
export const homeFontVariables = `${homeDisplay.variable} ${homeBody.variable}`;

// Sinhala letters, on every page. It only covers the Sinhala range, so the
// browser downloads it only when Sinhala text is on screen.
export const sinhalaFont = Noto_Sans_Sinhala({ subsets: ['sinhala'], variable: '--font-sinhala', display: 'swap', preload: false });
