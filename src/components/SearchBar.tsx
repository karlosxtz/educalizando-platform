'use client';
import { useDebounce } from '@/hooks/use-debounce';
import { quickSearch } from '@/lib/search-service';
import { discoverySuggestions, type SearchSuggestion } from '@/lib/search-suggestions';
import { addSearchHistory } from '@/lib/search-history';
import { Loader2, Search, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useState } from 'react';

const cache = new Map<string, { at: number; values: SearchSuggestion[] }>();
export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<{ query: string; values: SearchSuggestion[] }>({ query: '', values: [] });
  const [busy, setBusy] = useState(false); const [open, setOpen] = useState(false); const [active, setActive] = useState(-1);
  const debounced = useDebounce(query.trim(), 350); const router = useRouter(); const id = useId();
  const suggestions = result.query === query.trim() ? result.values : discoverySuggestions(query);
  const visible = open && query.trim().length >= 2;
  useEffect(() => {
    let alive = true;
    if (debounced.length < 2) { setBusy(false); return; }
    const cached = cache.get(debounced.toLocaleLowerCase('pt-BR'));
    if (cached && Date.now() - cached.at < 60000) { setResult({ query: debounced, values: cached.values }); setBusy(false); return; }
    setBusy(true);
    void quickSearch(debounced).then(products => {
      const values: SearchSuggestion[] = [...discoverySuggestions(debounced), ...products.filter(product => typeof product.id === 'string').map(product => ({ label: product.titulo, href: `/produto/${encodeURIComponent(product.id)}`, kind: 'Material' as const }))].slice(0, 8);
      if (cache.size >= 30) cache.delete(cache.keys().next().value!);
      cache.set(debounced.toLocaleLowerCase('pt-BR'), { at: Date.now(), values });
      if (alive) setResult({ query: debounced, values });
    }).catch(() => { if (alive) setResult({ query: debounced, values: discoverySuggestions(debounced) }); }).finally(() => { if (alive) setBusy(false); });
    return () => { alive = false; };
  }, [debounced]);
  function choose(href: string) { addSearchHistory(query.trim()); setOpen(false); setActive(-1); router.push(href); }
  return <form role="search" aria-label="Busca global de materiais" className="relative w-full" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false); }} onSubmit={event => { event.preventDefault(); if (query.trim()) choose(`/buscar?q=${encodeURIComponent(query.trim())}`); }}>
    <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">{busy ? <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin text-blue-600" /> : <Search aria-hidden="true" className="h-5 w-5 text-slate-400" />}</div>
    <input type="search" role="combobox" aria-label="Buscar materiais didáticos" aria-autocomplete="list" aria-expanded={visible} aria-controls={visible ? id : undefined} aria-activedescendant={visible && active >= 0 && suggestions[active] ? `${id}-${active}` : undefined} autoComplete="off" enterKeyHint="search" maxLength={120} value={query} onFocus={() => setOpen(true)} onChange={event => { setQuery(event.target.value); setOpen(true); setActive(-1); }} onKeyDown={event => {
      if (event.key === 'Escape') { setOpen(false); setActive(-1); }
      if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && suggestions.length) { event.preventDefault(); setOpen(true); setActive(index => event.key === 'ArrowDown' ? (index + 1) % suggestions.length : (index <= 0 ? suggestions.length - 1 : index - 1)); }
      if (event.key === 'Enter' && visible && active >= 0 && suggestions[active]) { event.preventDefault(); choose(suggestions[active].href); }
    }} placeholder="Busque por atividade, tema ou material" className="block min-h-12 w-full rounded-full border border-transparent bg-slate-100/50 py-3 pl-11 pr-20 text-sm font-medium text-slate-900 shadow-inner outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 sm:pr-24" />
    <button type="submit" className="absolute inset-y-1.5 right-1.5 rounded-full bg-blue-700 px-3 text-xs font-bold text-white hover:bg-blue-800 sm:px-4 sm:text-sm">Buscar</button>
    {visible && <div className="absolute left-0 top-full z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
      <p role="status" className="sr-only">{busy ? 'Buscando sugestões' : `${suggestions.length} sugestões. Use as setas para escolher e Enter para abrir.`}</p>
      <ul id={id} role="listbox" aria-label="Sugestões de busca" className="max-h-80 overflow-y-auto">{suggestions.map((item, index) => <li role="presentation" key={item.kind + item.href}><Link prefetch={false} id={`${id}-${index}`} role="option" aria-selected={active === index} href={item.href} onMouseEnter={() => setActive(index)} onClick={() => { addSearchHistory(query.trim()); setOpen(false); setActive(-1); }} className={`flex min-h-12 items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 focus:bg-blue-50 ${active === index ? 'bg-blue-50' : 'hover:bg-slate-50'}`}><span className="min-w-0"><span className="block truncate text-sm font-semibold text-slate-900">{item.label}</span><span className="text-[11px] text-slate-500">{item.kind}</span></span><ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0 text-blue-700" /></Link></li>)}</ul>
      <Link prefetch={false} href={`/buscar?q=${encodeURIComponent(query.trim())}`} onClick={() => { addSearchHistory(query.trim()); setOpen(false); }} className="flex min-h-12 items-center gap-2 bg-slate-50 px-4 text-sm font-bold text-blue-900"><Search aria-hidden="true" className="h-4 w-4" />Ver resultados para “{query.trim()}”</Link>
    </div>}
  </form>;
}
