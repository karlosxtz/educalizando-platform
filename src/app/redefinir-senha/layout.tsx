import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  alternates: { canonical: '/redefinir-senha' },
};

export default function PageLayout({ children }: { children: ReactNode }) {
  return children;
}
