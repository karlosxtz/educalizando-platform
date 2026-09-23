'use client';

import Link from 'next/link';

export default function CalendarError({ reset }: { reset: () => void }) {
  return <main className="mx-auto flex min-h-[50vh] max-w-2xl items-center px-4 py-10"><section role="alert" className="w-full rounded-3xl border border-rose-200 bg-white p-7 text-center shadow-sm"><p className="text-sm font-black uppercase tracking-wide text-rose-700">Não foi possível carregar o calendário</p><h1 className="mt-2 text-2xl font-black text-slate-950">Tente novamente em instantes</h1><p className="mt-3 text-sm leading-6 text-slate-600">Nenhuma alteração foi feita nos seus dados. Você pode tentar carregar a página outra vez ou voltar ao catálogo.</p><div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><button type="button" onClick={reset} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-700 px-5 text-sm font-black text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">Tentar novamente</button><Link href="/buscar" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-black text-slate-800 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">Explorar materiais</Link></div></section></main>;
}
