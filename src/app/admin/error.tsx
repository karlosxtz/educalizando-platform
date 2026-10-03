'use client';

import { AlertTriangle,RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[Admin] Falha ao renderizar o painel:', error.digest || error.name);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-4 text-slate-100">
      <section className="w-full max-w-lg rounded-3xl border border-rose-500/30 bg-slate-900 p-8 text-center shadow-2xl">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400">
          <AlertTriangle className="h-8 w-8" />
        </span>
        <h1 className="mt-5 text-2xl font-black text-white">Não foi possível abrir o painel</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">
          Sua conta continua segura. Tente carregar novamente; se a sessão tiver expirado, faça uma nova entrada.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-black text-white hover:bg-blue-500"
          >
            <RefreshCw className="h-4 w-4" /> Tentar novamente
          </button>
          <Link
            href="/login?returnTo=%2Fadmin"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-700 px-5 text-sm font-black text-slate-200 hover:bg-slate-800"
          >
            Entrar novamente
          </Link>
        </div>
      </section>
    </main>
  );
}
