'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Sparkles, LayoutDashboard, Store, Package, Tags, ShoppingCart, 
  Wallet, Settings, ExternalLink, LogOut, Menu, X, ChevronRight, User 
} from 'lucide-react';
import { signOutUser } from '@/lib/supabase';
import { Store as StoreType } from '@/lib/types';

interface SidebarProps {
  store?: StoreType | null;
  creatorName?: string;
  creatorEmail?: string;
}

export default function Sidebar({ store, creatorName = 'Prof. Ricardo Silva', creatorEmail = 'prof.ricardo@gmail.com' }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await signOutUser();
    router.push('/login');
  };

  const storeSlug = store?.slug || 'prof-ricardo';
  const storeName = store?.nome_loja || 'Prof. Ricardo Silva';

  const NAV_ITEMS = [
    {
      label: 'Visão Geral',
      href: '/dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      label: 'Configuração da Loja',
      href: '/dashboard/loja',
      icon: Store,
      badge: null
    },
    {
      label: 'Meus Produtos',
      href: '/dashboard/produtos',
      icon: Package,
      badge: null
    },
    {
      label: 'Categorias',
      href: '/dashboard/categorias',
      icon: Tags,
      badge: null
    },
    {
      label: 'Pedidos & Vendas',
      href: '/dashboard/pedidos',
      icon: ShoppingCart,
      badge: 'Em Breve'
    },
    {
      label: 'Financeiro',
      href: '/dashboard/financeiro',
      icon: Wallet,
      badge: 'Em Breve'
    },
    {
      label: 'Configurações da Conta',
      href: '/dashboard/conta',
      icon: Settings,
      badge: null
    }
  ];

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-lg font-black text-slate-900">
            Educa<span className="text-blue-600">lizando</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={`/loja/${storeSlug}`}
            target="_blank"
            className="p-2 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-200 flex items-center gap-1"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ver Loja</span>
          </Link>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Desktop Sidebar & Mobile Drawer Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 bottom-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } h-screen`}
      >
        <div className="p-5 space-y-6 overflow-y-auto flex-1">
          
          {/* Top Brand Logo */}
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-black text-slate-900 tracking-tight">
                  Educa<span className="text-blue-600">lizando</span>
                </span>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider -mt-1">
                  Painel do Criador
                </span>
              </div>
            </Link>

            <button onClick={() => setMobileOpen(false)} className="lg:hidden text-slate-400 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Current Store Badge */}
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
              {storeName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sua Loja Ativa:</span>
              <span className="text-xs font-bold text-slate-900 truncate block">{storeName}</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 pt-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 block mb-2">
              Menu Principal
            </span>

            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-bold shadow-xs border-l-4 border-blue-600'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200">
                      {item.badge}
                    </span>
                  ) : (
                    isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-600" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Open Public Store External Link */}
          <div className="pt-4 border-t border-slate-100">
            <Link
              href={`/loja/${storeSlug}`}
              target="_blank"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <ExternalLink className="w-4 h-4 text-emerald-600" />
                <span>Ver Loja Pública</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
            </Link>
          </div>
        </div>

        {/* Sidebar Footer: Creator Account & Logout */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-900 truncate block">{creatorName}</span>
              <span className="text-[10px] text-slate-500 truncate block">{creatorEmail}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700 border border-transparent hover:border-rose-200 transition-all flex-shrink-0"
            title="Encerrar Sessão"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Overlay Backdrop for Mobile Drawer */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}
    </>
  );
}
