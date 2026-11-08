import type { Metadata } from 'next';
import { ReactNode } from 'react';

// Keep the admin pages, including the login, out of search results.
export const metadata: Metadata = {
  title: 'Uni Shuttle Admin',
  robots: { index: false, follow: false }
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
