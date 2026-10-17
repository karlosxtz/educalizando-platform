'use client';

import { useEffect, useState, type ComponentProps, type ComponentType, type ReactNode } from 'react';
import type ProductDetailClientView from '@/app/loja/[slug]/produto/[produtoSlug]/ProductDetailClientView';

export default function ProductProgressiveView({ children, ...props }: ComponentProps<typeof ProductDetailClientView> & { children: ReactNode }) {
  const [Experience, setExperience] = useState<ComponentType<ComponentProps<typeof ProductDetailClientView>> | null>(null);
  useEffect(() => {
    let active = true;
    import('@/app/loja/[slug]/produto/[produtoSlug]/ProductDetailClientView').then(module => {
      if (active) setExperience(() => module.default);
    }).catch(() => { /* The public summary and checkout link remain usable. */ });
    return () => { active = false; };
  }, []);
  return Experience ? <Experience {...props} /> : children;
}
