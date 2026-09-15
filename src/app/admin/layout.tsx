'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Home, Store, Package, DollarSign, Wallet, LogOut, ShieldAlert, Tags, Settings, Megaphone, PlaySquare, MonitorPlay, Menu, X } from 'lucide-react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const adminEmail = process.env.SUPERADMIN_EMAIL || 'admin@educalizando.com.br';
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [mobileMenuOpen]);

  const navItems = [
    { href: '/admin', label: 'Visão Geral', icon: Home },
    { href: '/admin/lojas', label: 'Lojas & Criadores', icon: Store },
    { href: '/admin/produtos', label: 'Catálogo Global', icon: Package },
    { href: '/admin/transacoes', label: 'Transações', icon: DollarSign },
    { href: '/admin/saques', label: 'Solicitações de Saque', icon: Wallet, badge: 'Financeiro' },
    { href: '/admin/categorias', label: 'Categorias Globais', icon: Tags },
    { href: '/admin/avisos', label: 'Avisos Globais', icon: Megaphone },
    { href: '/admin/banners', label: 'Banners Principais', icon: MonitorPlay },
    { href: '/admin/tutoriais', label: 'Tutoriais (Criadores)', icon: PlaySquare },
    { href: '/admin/configuracoes', label: 'Configurações', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex font-sans selection:bg-blue-500/30">
      
      {/* Menu Lateral Admin */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 hidden md:flex flex-col">
        <div className="h-16 flex items-center justify-center border-b border-slate-800">
          <div className="flex items-center gap-2 text-blue-500 font-bold text-xl tracking-tight">
            <ShieldAlert className="w-6 h-6" />
            <span>Educalizando<span className="text-slate-100">OS</span></span>
          </div>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 px-3">
            Controle Mestre
          </div>
          <nav className="space-y-1">
            <Link href="/admin" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-300 rounded-lg hover:bg-blue-500/10 hover:text-blue-400 transition-colors">
              <Home className="w-4 h-4" />
              Visão Geral
            </Link>
            <Link href="/admin/lojas" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-300 rounded-lg hover:bg-blue-500/10 hover:text-blue-400 transition-colors">
              <Store className="w-4 h-4" />
              Lojas & Criadores
            </Link>
            <Link href="/admin/produtos" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-300 rounded-lg hover:bg-blue-500/10 hover:text-blue-400 transition-colors">
              <Package className="w-4 h-4" />
              Catálogo Global
            </Link>
            <Link href="/admin/transacoes" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-300 rounded-lg hover:bg-blue-500/10 hover:text-blue-400 transition-colors">
              <DollarSign className="w-4 h-4" />
              Transações
            </Link>
            <Link href="/admin/saques" className="flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-300 rounded-lg hover:bg-amber-500/10 hover:text-amber-400 transition-colors">
              <span className="flex items-center gap-3"><Wallet className="w-4 h-4" /> Solicitações de Saque</span>
              <span className="text-[9px] font-black uppercase tracking-wide text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">Financeiro</span>
            </Link>
            <Link href="/admin/categorias" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-300 rounded-lg hover:bg-blue-500/10 hover:text-blue-400 transition-colors">
              <Tags className="w-4 h-4" />
              Categorias Globais
            </Link>
            <Link href="/admin/avisos" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-300 rounded-lg hover:bg-blue-500/10 hover:text-blue-400 transition-colors">
              <Megaphone className="w-4 h-4" />
              Avisos Globais
            </Link>
            <Link href="/admin/banners" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-300 rounded-lg hover:bg-blue-500/10 hover:text-blue-400 transition-colors">
              <MonitorPlay className="w-4 h-4" />
              Banners Principais
            </Link>
            <Link href="/admin/tutoriais" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-300 rounded-lg hover:bg-blue-500/10 hover:text-blue-400 transition-colors">
              <PlaySquare className="w-4 h-4" />
              Tutoriais (Criadores)
            </Link>
            <Link href="/admin/configuracoes" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-300 rounded-lg hover:bg-blue-500/10 hover:text-blue-400 transition-colors">
              <Settings className="w-4 h-4" />
              Configurações
            </Link>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
              AD
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-200 truncate">Super Admin</p>
              <p className="text-[10px] text-slate-500 truncate">{adminEmail}</p>
            </div>
          </div>
          <Link href="/dashboard" className="flex items-center justify-center gap-2 w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors">
            <LogOut className="w-3.5 h-3.5" />
            Sair do Modo Deus
          </Link>
        </div>
      </aside>

      {/* Área Principal */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header Mobile */}
        <header className="h-16 border-b border-slate-800 bg-slate-950/50 backdrop-blur-md flex md:hidden items-center px-4 shrink-0">
          <div className="flex items-center gap-2 text-blue-500 font-bold text-lg flex-1">
            <ShieldAlert className="w-5 h-5" />
            <span>Educalizando<span className="text-slate-100">OS</span></span>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="min-h-11 min-w-11 rounded-lg border border-slate-700 text-slate-100 flex items-center justify-center hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label={mobileMenuOpen ? 'Fechar menu administrativo' : 'Abrir menu administrativo'}
            aria-expanded={mobileMenuOpen}
            aria-controls="admin-mobile-navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {mobileMenuOpen && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm md:hidden"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Fechar menu administrativo"
            />
            <aside
              id="admin-mobile-navigation"
              aria-label="Menu administrativo"
              className="fixed inset-y-0 left-0 z-50 w-[min(86vw,22rem)] bg-slate-950 border-r border-slate-800 shadow-2xl md:hidden flex flex-col"
            >
              <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-500 font-bold text-lg">
                  <ShieldAlert className="w-5 h-5" />
                  <span>Educalizando<span className="text-slate-100">OS</span></span>
                </div>
                <button type="button" onClick={() => setMobileMenuOpen(false)} className="min-h-11 min-w-11 rounded-lg text-slate-300 hover:bg-slate-800 flex items-center justify-center" aria-label="Fechar menu">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 px-3">Controle Mestre</p>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Link key={item.href} href={item.href} className={`min-h-11 flex items-center justify-between gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${active ? 'bg-blue-500/15 text-blue-400' : 'text-slate-300 hover:bg-blue-500/10 hover:text-blue-400'}`}>
                      <span className="flex items-center gap-3"><Icon className="w-4 h-4" />{item.label}</span>
                      {item.badge && <span className="text-[9px] font-black uppercase tracking-wide text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">{item.badge}</span>}
                    </Link>
                  );
                })}
              </nav>
              <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">AD</div>
                  <div className="overflow-hidden"><p className="text-xs font-bold text-slate-200 truncate">Super Admin</p><p className="text-[10px] text-slate-500 truncate">{adminEmail}</p></div>
                </div>
                <Link href="/dashboard" className="min-h-11 flex items-center justify-center gap-2 w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"><LogOut className="w-3.5 h-3.5" />Sair do Modo Deus</Link>
              </div>
            </aside>
          </>
        )}

        {/* Conteúdo Dinâmico */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
