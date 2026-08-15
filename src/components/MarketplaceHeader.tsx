'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, LogIn, ShoppingCart, Store } from 'lucide-react';

export default function MarketplaceHeader() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-slate-200 py-3 shadow-sm'
          : 'bg-white py-4 border-b border-slate-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center shrink-0">
          <img
            src="/branding/logo-educalizando.png"
            alt="Educalizando"
            className="h-10 w-auto object-contain"
          />
        </Link>

        {/* Search Bar (Hidden on very small screens) */}
        <div className="hidden md:flex flex-1 max-w-2xl mx-8 relative">
          <input
            type="text"
            placeholder="O que você quer ensinar hoje?"
            className="w-full bg-slate-100 border-none rounded-full pl-12 pr-6 py-3 text-sm focus:ring-2 focus:ring-brand-primary/20 transition-all outline-none"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/vender"
            className="hidden sm:flex px-4 py-2.5 rounded-full font-bold text-xs bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary transition-all items-center gap-2"
          >
            <Store className="w-4 h-4" />
            <span>Quero Vender</span>
          </Link>
          
          <Link
            href="/aluno/login"
            className="p-2.5 rounded-full text-slate-600 hover:bg-slate-100 transition-colors"
            title="Minhas Compras"
          >
            <ShoppingCart className="w-5 h-5" />
          </Link>

          <Link
            href="/login"
            className="px-5 py-2.5 rounded-full font-bold text-sm bg-brand-primary hover:bg-brand-secondary text-white transition-all shadow-md shadow-brand-primary/20"
          >
            Entrar
          </Link>
        </div>
      </div>
    </header>
  );
}
