'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Store, Package, ExternalLink, ArrowLeft } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans">
      {/* Dashboard Navbar */}
      <header className="sticky top-0 z-50 bg-[#0b0f19]/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#ff5722] to-[#6366f1] flex items-center justify-center shadow-lg shadow-[#ff5722]/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-black tracking-tight text-white hidden sm:inline">
                Educa<span className="text-[#ff5722]">lizando</span>
              </span>
            </Link>

            <span className="text-xs font-bold bg-white/5 border border-white/10 px-2.5 py-1 rounded-full text-slate-300">
              Painel do Criador
            </span>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-2">
            <Link
              href="/dashboard/loja"
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                pathname === '/dashboard/loja'
                  ? 'bg-[#ff5722] text-white shadow-lg shadow-[#ff5722]/25'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300'
              }`}
            >
              <Store className="w-4 h-4" />
              <span className="hidden sm:inline">Configuração da</span> Loja
            </Link>

            <Link
              href="/dashboard/produtos"
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                pathname === '/dashboard/produtos'
                  ? 'bg-[#ff5722] text-white shadow-lg shadow-[#ff5722]/25'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300'
              }`}
            >
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Meus</span> Produtos
            </Link>

            <Link
              href="/loja/prof-ricardo"
              target="_blank"
              className="px-3 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Ver Loja Pública</span>
            </Link>
          </nav>

          {/* Back Home CTA */}
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Sair</span>
          </Link>
        </div>
      </header>

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
