import { ReactNode } from 'react';
import { Home, Users, Store, Package, DollarSign, LogOut, ShieldAlert, Tags, Settings, Megaphone, PlaySquare } from 'lucide-react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const adminEmail = process.env.SUPERADMIN_EMAIL || 'admin@educalizando.com.br';

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
            <Link href="/admin/categorias" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-300 rounded-lg hover:bg-blue-500/10 hover:text-blue-400 transition-colors">
              <Tags className="w-4 h-4" />
              Categorias Globais
            </Link>
            <Link href="/admin/avisos" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-300 rounded-lg hover:bg-blue-500/10 hover:text-blue-400 transition-colors">
              <Megaphone className="w-4 h-4" />
              Avisos Globais
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
        {/* Header Mobile (simples) */}
        <header className="h-16 border-b border-slate-800 bg-slate-950/50 backdrop-blur-md flex md:hidden items-center px-4 shrink-0">
          <div className="flex items-center gap-2 text-blue-500 font-bold text-lg">
            <ShieldAlert className="w-5 h-5" />
            <span>Educalizando<span className="text-slate-100">OS</span></span>
          </div>
        </header>

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
