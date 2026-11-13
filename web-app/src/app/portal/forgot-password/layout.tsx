import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Reset your password | UniShuttle'
};

export default function ForgotPasswordLayout({ children }: { children: ReactNode }) {
  return children;
}
