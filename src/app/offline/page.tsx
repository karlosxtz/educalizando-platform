'use client';

import Link from 'next/link';
import Image from 'next/image';
import { WifiOff, RefreshCw, Home } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between items-center p-6 font-sans">
      <header className="w-full max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo-icon.png" alt="Educalizando" width={36} height={36} className="w-9 h-9 object-contain" />
          <span className="text-xl font-black text-brand-navy">
            Educa<span className="text-brand-teal">lizando</span>
          </span>
        </Link>
      </header>

      <main className="max-w-md w-full text-center space-y-6 my-auto bg-white p-8 rounded-3xl border border-slate-200 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-brand-amber border border-amber-200 flex items-center justify-center mx-auto shadow-xs">
          <WifiOff className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Você está sem conexão
          </h1>
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            Não conseguimos se conectar à internet. Verifique sua conexão com o Wi-Fi ou dados móveis para continuar navegando.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3.5 rounded-xl font-bold text-sm bg-brand-navy hover:bg-brand-navy-hover text-white shadow-md shadow-brand-navy/20 flex items-center justify-center gap-2 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Tentar Novamente</span>
          </button>

          <Link
            href="/"
            className="w-full py-3 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center justify-center gap-2 transition-all"
          >
            <Home className="w-4 h-4 text-slate-500" />
            <span>Voltar ao Início (Modo Offline)</span>
          </Link>
        </div>
      </main>

      <footer className="text-xs text-slate-400 text-center font-medium">
        Educalizando PWA — Modo de Redirecionamento Offline
      </footer>
    </div>
  );
}
