'use client';

import { useSyncExternalStore } from 'react';
import { Eye } from 'lucide-react';
import { getRecentViews, RecentProduct, subscribeToRecentViews } from '@/lib/recent-views';
import ProductCard from './ProductCard';

const EMPTY_RECENT_PRODUCTS: RecentProduct[] = [];

export default function RecentlyViewed() {
  const recentProducts = useSyncExternalStore(
    subscribeToRecentViews,
    getRecentViews,
    () => EMPTY_RECENT_PRODUCTS,
  );

  if (recentProducts.length === 0) {
    return null;
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 border-b border-slate-200">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Eye className="w-8 h-8 text-blue-500" />
          Vistos Recentemente
        </h2>
      </div>
      
      <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:gap-6 lg:grid-cols-4">
        {recentProducts.map(produto => (
          <ProductCard key={produto.id} product={produto} />
        ))}
      </div>
    </section>
  );
}
