import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Sign in | UniShuttle'
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
