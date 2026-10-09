'use client';

import { getRecentViews, subscribeToRecentViews } from '@/lib/recent-views';
import { clearSearchHistory, getSearchHistory, subscribeToSearchHistory } from '@/lib/search-history';
import { Clock3, Eye, X } from 'lucide-react';
import Link from 'next/link';
import { useSyncExternalStore } from 'react';

const EMPTY_SEARCHES: string[] = [];
const EMPTY_VIEWS: ReturnType<typeof getRecentViews> = [];

export default function SearchDiscovery() {
  const searches = useSyncExternalStore(subscribeToSearchHistory, getSearchHistory, () => EMPTY_SEARCHES);
  const views = useSyncExternalStore(subscribeToRecentViews, getRecentViews, () => EMPTY_VIEWS).slice(0, 4);
  if (!searches.length && !views.length) return null;
  return <section className="mt-5 grid gap-3 md:grid-cols-2" aria-label="Seu histórico de descoberta">
    {searches.length > 0 && <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-sm font-black text-slate-800"><Clock3 className="h-4 w-4 text-blue-600" />Buscas recentes</h2><button type="button" onClick={clearSearchHistory} className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-bold text-slate-500 hover:bg-white"><X className="h-3.5 w-3.5" />Limpar</button></div>
      <div className="mt-3 flex flex-wrap gap-2">{searches.map(query => <Link key={query} href={`/buscar?q=${encodeURIComponent(query)}`} className="inline-flex min-h-10 items-center rounded-full border border-blue-100 bg-white px-3 text-xs font-bold text-blue-700 hover:border-blue-300">{query}</Link>)}</div>
    </div>}
    {views.length > 0 && <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><h2 className="flex items-center gap-2 text-sm font-black text-slate-800"><Eye className="h-4 w-4 text-violet-600" />Vistos recentemente</h2><div className="mt-3 flex flex-wrap gap-2">{views.map(product => <Link key={product.id} href={product.store?.slug && product.slug ? `/loja/${product.store.slug}/produto/${product.slug}` : `/produto/${product.slug || product.id}`} className="inline-flex min-h-10 max-w-full items-center rounded-full border border-violet-100 bg-white px-3 text-xs font-bold text-violet-700 hover:border-violet-300"><span className="truncate">{product.titulo}</span></Link>)}</div></div>}
  </section>;
}
