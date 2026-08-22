'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, ShoppingBag, Link2, Wallet, Settings, 
  LogOut, Menu, X, ChevronRight, User, Store, BarChart3,
  MousePointerClick, ArrowLeftRight, Palette
} from 'lucide-react';
import { signOutUser } from '@/lib/supabase';
import { saveRolePreference } from '@/lib/role-service';

interface AffiliateSidebarProps {
  userName?: string;
  userEmail?: string;
  hasCreatorRole?: boolean;
}

export default function AffiliateSidebar({ 
  userName = 'Afiliado', 
  userEmail = 'afiliado@educalizando.com.br',
  hasCreatorRole = false
}: AffiliateSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await signOutUser();
    router.push('/afiliados/login');
  };

  const handleSwitchToCreator = () => {
    saveRolePreference('creator');
    window.location.href = '/dashboard';
  };

  const NAV_ITEMS = [
    {
      label: 'Visão Geral',
      href: '/dashboard/afiliacoes',
      icon: LayoutDashboard,
      badge: null
    },
    {
      label: 'Mercado de Produtos',
      href: '/dashboard/afiliacoes/mercado',
      icon: ShoppingBag,
      badge: null
    },
    {
      label: 'Carteira & Saques',
      href: '/dashboard/afiliacoes',
      icon: Wallet,
      badge: null,
      hash: '#carteira'
    },
    {
      label: 'Personalizar Vitrine',
      href: '/dashboard/afiliacoes/vitrine',
      icon: Palette,
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

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Desktop Sidebar & Mobile Drawer Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 bottom-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } h-screen`}
      >
        <div className="p-5 space-y-6 overflow-y-auto flex-1">
          
          {/* Top Brand Logo */}
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
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200/90 text-teal-800 text-[10px] font-extrabold shrink-0 shadow-2xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                </span>
                <span className="hidden sm:inline">Afiliado</span>
              </div>

              <button onClick={() => setMobileOpen(false)} className="lg:hidden text-slate-400 p-1 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Active Context Badge */}
          <div className="bg-teal-50 border border-teal-200 p-3 rounded-xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-xs">
              <Link2 className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-teal-500 uppercase tracking-wider block">Área Ativa:</span>
              <span className="text-xs font-bold text-slate-900 truncate block">Central de Afiliados</span>
            </div>
          </div>

          {/* Role Switcher */}
          {hasCreatorRole && (
            <button
              onClick={handleSwitchToCreator}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <ArrowLeftRight className="w-4 h-4 text-indigo-500" />
                <span>Alternar para Criador</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
            </button>
          )}

          {/* Navigation Links */}
          <nav className="space-y-1 pt-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 block mb-2">
              Menu do Afiliado
            </span>

            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href + (item.hash || '')}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-teal-50 text-teal-700 font-bold shadow-xs border-l-4 border-teal-600'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-teal-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-600 px-2 py-0.5 rounded-full border border-teal-200">
                      {item.badge}
                    </span>
                  ) : (
                    isActive && <ChevronRight className="w-3.5 h-3.5 text-teal-600" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-900 truncate block">{userName}</span>
              <span className="text-[10px] text-slate-500 truncate block">{userEmail}</span>
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
