'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { searchHref } from '@/lib/search-navigation';

export default function SearchQuery() {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  return <form key={params.get('q') || ''} className="mt-5 max-w-2xl" role="search" aria-label="Pesquisar no catálogo" onSubmit={event => {
    event.preventDefault();
    if (pending) return;
    const q = String(new FormData(event.currentTarget).get('q') || '').trim();
    startTransition(() => router.push(searchHref(params.toString(), { q: q || null }), { scroll: false }));
  }}>
    <label htmlFor="catalog-query" className="mb-2 block text-sm font-semibold text-slate-700">Buscar materiais</label>
    <div className="flex gap-2"><input id="catalog-query" name="q" type="search" defaultValue={params.get('q') || ''} placeholder="Ex.: alfabetização" className="min-h-12 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-base focus-visible:outline-2 focus-visible:outline-blue-600" /><button type="submit" disabled={pending} className="min-h-12 rounded-xl bg-blue-600 px-4 font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-60">Buscar</button></div>
    <p role="status" className="min-h-6 pt-1 text-sm text-blue-700">{pending ? 'Buscando materiais…' : ''}</p>
  </form>;
}
