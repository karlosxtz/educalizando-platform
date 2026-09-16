'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ShoppingCart, UserRound } from 'lucide-react';
import CategoryDropdown from './CategoryDropdown';
import SearchBar from './SearchBar';
import { useCart } from '@/components/store/CartContext';
import { supabase } from '@/lib/supabase';

export default function MarketplaceHeader() {
  return (
    <Suspense fallback={<div className="h-[73px] w-full bg-white border-b border-slate-100 flex items-center justify-center text-slate-400 text-sm font-semibold">Carregando menu...</div>}>
      <MarketplaceHeaderInner />
    </Suspense>
  );
}

function MarketplaceHeaderInner() {
  const { items, toggleCart, total } = useCart();
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = useState(false);
  const [accountAreaHref, setAccountAreaHref] = useState<string | null>(null);

  const currentCategoria = searchParams?.get('categoria');
  const currentSort = searchParams?.get('sort');
  const currentFilter = searchParams?.get('filter');

  useEffect(() => {
    setIsMounted(true);
    const resolveArea = (user?: { user_metadata?: Record<string, unknown> } | null) => {
      const role = typeof user?.user_metadata?.role === 'string' ? user.user_metadata.role : localStorage.getItem('educalizando_active_role');
      if (role === 'affiliate') return '/dashboard/afiliacoes';
      if (role === 'creator' || localStorage.getItem('educalizando_creator_session')) return '/dashboard';
      return '/cliente/dashboard';
    };
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) setAccountAreaHref(resolveArea(data.session.user));
      else if (localStorage.getItem('educalizando_creator_session') || localStorage.getItem('educalizando_student_session') || localStorage.getItem('educalizando_session')) setAccountAreaHref(resolveArea());
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAccountAreaHref(session?.user ? resolveArea(session.user) : null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const cartItemsCount = isMounted ? items.reduce((acc, item) => acc + item.quantity, 0) : 0;
  return (
    <header className="w-full sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-slate-100 transition-all">
      {cartItemsCount > 0 && (
        <Link href="/carrinho" className="flex min-h-8 items-center justify-center gap-1.5 bg-emerald-600 px-3 py-1 text-center text-[11px] font-bold text-white sm:text-xs">
          <span aria-hidden="true">🎁</span>
          <span>Seu carrinho: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}.</span>
          <span className="underline underline-offset-2">Ver ofertas</span>
        </Link>
      )}
      <div className="py-3 sm:py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
          
          {/* Esquerda: Logo */}
          <div className="flex items-center justify-between w-full md:w-auto">
            <Link href="/" className="flex items-center cursor-pointer group shrink-0">
              <img
                src="/branding/logo-educalizando.png?v=3"
                alt="Educalizando"
                className="h-10 sm:h-11 w-auto object-contain transition-transform group-hover:scale-[1.02]"
                style={{ width: 'auto', height: '42px' }}
              />
            </Link>
            
            <div className="flex md:hidden items-center gap-1">
              <Link
                href={accountAreaHref || '/entrar'}
                aria-label={accountAreaHref ? 'Acessar minha área' : 'Entrar ou criar conta'}
                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-full transition-colors"
              >
                <UserRound className="w-5 h-5" />
              </Link>
              <button onClick={toggleCart} aria-label="Abrir carrinho" className="min-h-11 min-w-11 p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-full transition-colors relative">
                <ShoppingCart className="w-6 h-6" />
                {cartItemsCount > 0 && (
                  <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white">
                    {cartItemsCount > 9 ? '9+' : cartItemsCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Centro: Barra de Pesquisa Global */}
          <div className="flex-1 w-full max-w-2xl px-0 md:px-6">
            <SearchBar />
          </div>

          {/* Direita: Ações do Usuário */}
          <div className="hidden md:flex items-center gap-3">
            {accountAreaHref ? (
              <Link href={accountAreaHref} className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-6 py-2.5 rounded-full transition-all shadow-md shadow-blue-500/20">
                Acessar minha área
              </Link>
            ) : <>
              <Link href="/cadastro" className="text-sm font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 px-4 py-2.5 rounded-full transition-all border border-transparent hover:border-blue-100">Criar Conta</Link>
              <Link href="/entrar" className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-6 py-2.5 rounded-full transition-all shadow-md shadow-blue-500/20">Entrar</Link>
            </>}
            
            <div className="w-px h-6 bg-slate-200 mx-1"></div>

            <button onClick={toggleCart} className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-full transition-colors relative group">
              <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {cartItemsCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white shadow-sm">
                  {cartItemsCount > 9 ? '9+' : cartItemsCount}
                </span>
              )}
            </button>
          </div>
          
        </div>
      </div>

      </div>
      {/* 2. Navegação Secundária */}
      <div className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2.5 sm:py-3 gap-2 sm:gap-4">
            
            {/* Esquerda: Links Simples */}
            <div className="flex w-full sm:w-auto items-center gap-5 overflow-x-auto hide-scroll-bar pb-1 sm:pb-0">
              <Link href="/" className="whitespace-nowrap text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors">
                Início
              </Link>
              <CategoryDropdown />
              <Link href="/lojas" className="whitespace-nowrap text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">
                Lojas
              </Link>
            </div>

            {/* Direita: Pills Elegantes */}
            <div className="flex w-full sm:w-auto items-center gap-2 overflow-x-auto hide-scroll-bar pb-1 sm:pb-0">
              <Link 
                href="/buscar?sort=popular"
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${currentSort === 'popular' ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
              >
                🔥 Mais Vendidos
              </Link>
              <Link 
                href="/buscar?categoria=ensino-fundamental" 
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${currentCategoria === 'ensino-fundamental' ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
              >
                🎒 Ensino Fundamental
              </Link>
              <Link 
                href="/buscar?categoria=jogos"
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${currentCategoria === 'jogos' ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
              >
                🧩 Recursos Lúdicos
              </Link>
              <Link 
                href="/buscar?filter=plr"
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${currentFilter === 'plr' ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
              >
                💼 Revenda Autorizada
              </Link>
            </div>
            
          </div>
        </div>
      </div>
    </header>
  );
}
