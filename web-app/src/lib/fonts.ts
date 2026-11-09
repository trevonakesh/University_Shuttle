import { JetBrains_Mono, Manrope, Unbounded } from 'next/font/google';

const display = Unbounded({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const body = Manrope({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

// Add to the outermost element of any page using the public-site type.
export const fontVariables = `${display.variable} ${body.variable} ${mono.variable}`;
