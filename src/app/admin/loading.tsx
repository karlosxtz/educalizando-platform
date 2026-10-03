'use client';

import Image from 'next/image';
import Link from 'next/link';
import { RefreshCw,ShieldAlert } from 'lucide-react';
import { useEffect,useState } from 'react';

const SLOW_LOADING_NOTICE_MS = 10_000;

export default function AdminLoading() {
  const [takingLonger, setTakingLonger] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setTakingLonger(true), SLOW_LOADING_NOTICE_MS);
    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <main
      aria-busy="true"
      aria-label="Carregando painel administrativo"
      className="grid min-h-screen place-items-center bg-slate-950 px-4 text-slate-100"
    >
      <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl">
        <Image
          src="/branding/logo-educalizando-icon-192.png"
          alt=""
          width={96}
          height={96}
          className="mx-auto h-20 w-20 object-contain"
          priority
        />
        <p className="mt-3 text-xl font-black text-white">Painel administrativo</p>
        <div className="mx-auto mt-7 h-2 w-48 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-blue-500" />
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-300">Validando sua sessão com segurança…</p>

        {takingLonger && (
          <div role="alert" className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-left">
            <p className="flex items-center gap-2 text-sm font-black text-amber-200">
              <ShieldAlert className="h-5 w-5" /> O carregamento está demorando
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">
              A sessão pode ter expirado. Recarregue o painel ou entre novamente para renovar o acesso.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white hover:bg-blue-500"
              >
                <RefreshCw className="h-4 w-4" /> Tentar novamente
              </button>
              <Link
                href="/login?returnTo=%2Fadmin"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-700 px-4 text-sm font-black text-slate-200 hover:bg-slate-800"
              >
                Entrar novamente
              </Link>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
