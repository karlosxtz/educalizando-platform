'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  LayoutDashboard, Store, Package, Boxes, Ticket, Tags, ShoppingCart, 
  Wallet, Settings, ExternalLink, LogOut, Menu, X, ChevronRight, User, Users, FolderCheck, PlaySquare, Library, Gift
} from 'lucide-react';
import { signOutUser } from '@/lib/supabase';
import { Store as StoreType } from '@/lib/types';
import NotificationCenter from '@/components/dashboard/NotificationCenter';

interface SidebarProps {
  store?: StoreType | null;
  storeId?: string;
  creatorName?: string;
  creatorEmail?: string;
}

export default function Sidebar({ store, storeId, creatorName = 'Prof. Ricardo Silva', creatorEmail = 'prof.ricardo@gmail.com' }: SidebarProps) {
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
      label: 'Aprenda a Usar',
      href: '/dashboard/tutoriais',
      icon: PlaySquare,
      badge: 'NOVO'
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
      label: 'Material Grátis',
      href: '/dashboard/brindes',
      icon: Gift,
      badge: 'NOVO'
    },
    {
      label: 'Mercado de PLR',
      href: '/dashboard/plr',
      icon: Library,
      badge: 'NOVO'
    },
    {
      label: 'PLRs Comprados',
      href: '/dashboard/plr/comprados',
      icon: Package,
      badge: null
    },
    {
      label: 'Conteúdo & Entregas',
      href: '/dashboard/conteudo',
      icon: FolderCheck,
      badge: null
    },
    {
      label: 'Kits (Combos)',
      href: '/dashboard/kits',
      icon: Boxes,
      badge: null
    },
    {
      label: 'Cupons de Desconto',
      href: '/dashboard/cupons',
      icon: Ticket,
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
      badge: null
    },
    {
      label: 'Clientes',
      href: '/dashboard/clientes',
      icon: Users,
      badge: null
    },
    {
      label: 'Meus Afiliados',
      href: '/dashboard/afiliados',
      icon: Users, // Pode usar outro ícone se quiser, ex: Handshake, mas Users funciona
      badge: 'NOVO'
    },
    {
      label: 'Financeiro',
      href: '/dashboard/financeiro',
      icon: Wallet,
      badge: null
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
        <Link href="/" className="flex items-center gap-2.5">
          <img
            src="/branding/logo-educalizando.png"
            alt="Educalizando"
            className="h-9 w-auto object-contain"
            style={{ width: 'auto', height: '36px' }}
          />
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={`/loja/${storeSlug}`}
            target="_blank"
            className="p-2 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1"
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
          
          {/* Top Brand Logo & Active Store Indicator */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <Link href="/" className="flex items-center group shrink-0">
              <img
                src="/branding/logo-educalizando.png"
                alt="Educalizando"
                className="h-[48px] sm:h-[50px] w-auto object-contain transition-transform group-hover:scale-[1.02]"
                style={{ width: 'auto', height: '50px' }}
              />
            </Link>

            <div className="flex items-center gap-2">
              {/* Notificações em tempo real */}
              {storeId && <NotificationCenter storeId={storeId} />}

              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/90 text-emerald-800 text-[10px] font-extrabold shrink-0 shadow-2xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="hidden sm:inline">Loja ativa</span>
              </div>

              <button onClick={() => setMobileOpen(false)} className="lg:hidden text-slate-400 p-1 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Current Store Badge */}
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-navy text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-xs">
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
                      ? 'bg-slate-100 text-brand-navy font-bold shadow-xs border-l-4 border-brand-navy'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-brand-navy'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-brand-navy' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200">
                      {item.badge}
                    </span>
                  ) : (
                    isActive && <ChevronRight className="w-3.5 h-3.5 text-brand-navy" />
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
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-brand-green bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <ExternalLink className="w-4 h-4 text-brand-green" />
                <span>Ver Loja Pública</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-brand-green" />
            </Link>
          </div>
        </div>

        {/* Sidebar Footer: Creator Account & Logout */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-brand-navy text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
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
