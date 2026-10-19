'use client';
import { useEffect, useRef, useState } from 'react';
import { HomeIntroduction } from '@/components/HomeBrandContent';
import HomeDiscoveryBanners from '@/components/HomeDiscoveryBanners';
import { selectHomeHighlights } from '@/lib/home-highlight-selection';
import type { Product } from '@/lib/types';

export default function HomeRotatingHighlights({ products, freeProducts }: { products: Product[]; freeProducts: Product[] }) {
  // Identical SSR/hydration output; visitor-specific rotation begins after hydration.
  const [selection, setSelection] = useState(() => selectHomeHighlights(products, freeProducts, () => 0));
  const hovered = useRef(false);
  useEffect(() => {
    const rotate = (initial = false) => {
      if (document.hidden || hovered.current || (!initial && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
      const active = document.activeElement;
      if (active?.closest('[data-home-highlights]')) return;
      setSelection(previous => selectHomeHighlights(products, freeProducts, Math.random, [previous.hero?.id, previous.free?.id, previous.offer?.id].filter((id): id is string => Boolean(id))));
    };
    const first = setTimeout(() => rotate(true), 1000);
    const timer = setInterval(() => rotate(), 12000);
    return () => { clearTimeout(first); clearInterval(timer); };
  }, [products, freeProducts]);
  return <div data-home-highlights onPointerEnter={() => { hovered.current = true; }} onPointerLeave={() => { hovered.current = false; }}><HomeIntroduction products={selection.hero ? [selection.hero] : []} /><HomeDiscoveryBanners freeProduct={selection.free} offer={selection.offer} /></div>;
}
