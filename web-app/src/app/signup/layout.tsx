import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Create an account | UniShuttle'
};

export default function SignupLayout({ children }: { children: ReactNode }) {
  return children;
}
