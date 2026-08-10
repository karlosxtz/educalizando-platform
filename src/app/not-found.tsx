'use client';

import Link from 'next/link';
import { Store, ArrowLeft, HelpCircle, Sparkles } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans relative overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="p-6 max-w-7xl w-full mx-auto flex items-center justify-between relative z-10">
        <Link href="/" className="flex items-center">
          <img
            src="/branding/logo-educalizando.png"
            alt="Educalizando"
            className="h-10 w-auto object-contain"
            style={{ width: 'auto', height: '40px' }}
          />
        </Link>
      </header>

      {/* Main 404 Card */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10 my-8">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mx-auto">
            <HelpCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 inline-block">
              ERRO 404
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              Loja Não Encontrada
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              A loja ou página que você está tentando acessar não existe, mudou de endereço ou foi desativada pelo criador.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <Link
              href="/"
              className="w-full py-3.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar para a Página Inicial</span>
            </Link>

            <Link
              href="/#cadastro"
              className="w-full py-3 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center justify-center gap-2"
            >
              <Store className="w-4 h-4 text-blue-600" />
              <span>Criar minha própria loja grátis</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-slate-500 relative z-10">
        <p>© {new Date().getFullYear()} Educalizando Plataforma Digital — Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
