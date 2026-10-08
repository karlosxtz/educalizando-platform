import { pageMetadata } from '@/lib/page-seo';
import type { ReactNode } from 'react';

export function generateMetadata() { return pageMetadata('/afiliados/cadastro'); }

export default function PageLayout({ children }: { children: ReactNode }) {
  return children;
}
