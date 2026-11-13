import { Fredoka, Nunito } from 'next/font/google';

// The public pages: rounded, friendly type that matches the logo's curves.
const homeDisplay = Fredoka({ subsets: ['latin'], variable: '--font-home-display', display: 'swap' });
const homeBody = Nunito({ subsets: ['latin'], variable: '--font-home-body', display: 'swap' });
export const homeFontVariables = `${homeDisplay.variable} ${homeBody.variable}`;
