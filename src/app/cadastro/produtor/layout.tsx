import { pageMetadata } from '@/lib/page-seo';
import type { ReactNode } from 'react';

export function generateMetadata() { return pageMetadata('/cadastro/produtor'); }

export default function PageLayout({ children }: { children: ReactNode }) {
  return children;
}
