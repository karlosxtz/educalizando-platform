import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  alternates: { canonical: '/carrinho' },
};

export default function PageLayout({ children }: { children: ReactNode }) {
  return children;
}
