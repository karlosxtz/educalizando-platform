'use client';

import { useEffect, useState } from 'react';
import { Eye, ChevronRight } from 'lucide-react';
import { getRecentViews, RecentProduct } from '@/lib/recent-views';
import ProductCard from './ProductCard';

export default function RecentlyViewed() {
  const [recentProducts, setRecentProducts] = useState<RecentProduct[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setRecentProducts(getRecentViews());
    setMounted(true);
  }, []);

  if (!mounted || recentProducts.length === 0) {
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
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {recentProducts.map(produto => (
          <ProductCard key={produto.id} product={produto} />
        ))}
      </div>
    </section>
  );
}
