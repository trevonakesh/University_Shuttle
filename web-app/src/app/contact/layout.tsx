import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Contact us | UniShuttle',
  description: 'Send the UniShuttle team a message about buses, driver registration or fares.'
};

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children;
}
