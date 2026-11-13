import { Fredoka, JetBrains_Mono, Manrope, Nunito, Unbounded } from 'next/font/google';

// The bright home page: rounded, friendly type that matches the logo's curves.
const homeDisplay = Fredoka({ subsets: ['latin'], variable: '--font-home-display', display: 'swap' });
const homeBody = Nunito({ subsets: ['latin'], variable: '--font-home-body', display: 'swap' });
export const homeFontVariables = `${homeDisplay.variable} ${homeBody.variable}`;

const display = Unbounded({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const body = Manrope({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

// Add to the outermost element of any page using the public-site type.
export const fontVariables = `${display.variable} ${body.variable} ${mono.variable}`;
