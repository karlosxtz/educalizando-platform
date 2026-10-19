'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, Loader2, Store as StoreIcon } from 'lucide-react';
import { customerApi } from '@/lib/customer-api';
import CatalogImage from '@/components/ui/CatalogImage';
import type { Store } from '@/lib/types';

type Follow = { store_id: string; notifications_enabled: boolean; store: Pick<Store, 'id' | 'slug' | 'nome_loja' | 'logo_url'> | null };
type News = { id: string; titulo: string; slug: string; capa_url: string | null };
export default function FollowedStores() {
  const [follows, setFollows] = useState<Follow[]>([]); const [news, setNews] = useState<News[]>([]);
  const [more, setMore] = useState(false); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const load = () => { void customerApi('/api/customer/followed-stores').then(data => { if (active) { setFollows(data.follows); setNews(data.news); setMore(data.hasMore); setError(''); } }).catch(() => { if (active) setError('Não foi possível carregar suas lojas e novidades.'); }).finally(() => { if (active) setLoading(false); }); };
    load(); window.addEventListener('educalizando:follow-change', load);
    return () => { active = false; window.removeEventListener('educalizando:follow-change', load); };
  }, []);
  async function update(row: Follow, following: boolean, notifications: boolean) {
    setLoading(true); setError('');
    try {
      await customerApi('/api/customer/followed-stores', { method: 'POST', body: JSON.stringify({ storeId: row.store_id, following, notifications }) });
      window.dispatchEvent(new Event('educalizando:follow-change'));
    } catch { setError('Não foi possível atualizar essa loja.'); setLoading(false); }
  }
  async function next() {
    setLoading(true);
    try { const data = await customerApi(`/api/customer/followed-stores?offset=${follows.length}`); setFollows(current => [...current, ...data.follows]); setNews(current => [...new Map([...current, ...data.news].map(item => [item.id, item])).values()]); setMore(data.hasMore); }
    catch { setError('Não foi possível carregar mais lojas.'); }
    finally { setLoading(false); }
  }
  return <section id="lojas-seguidas" className="mt-8 scroll-mt-24 space-y-5 rounded-3xl border border-blue-100 bg-white p-5 sm:p-7">
    <div><h2 className="flex items-center gap-2 text-xl font-black text-slate-950"><StoreIcon className="h-5 w-5 text-blue-700" />Lojas que você segue</h2><p className="mt-2 text-sm leading-6 text-slate-600">Salve suas lojas preferidas e escolha de quais deseja ver novidades aqui. Você pode parar de seguir ou desativar as novidades quando quiser.</p></div>
    {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
    {loading && <p role="status" className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Atualizando…</p>}
    {!loading && !error && !follows.length && <p className="text-sm text-slate-600">Abra uma loja e toque em “Seguir loja”. <Link href="/lojas" className="font-bold text-blue-800 underline">Conhecer lojas</Link></p>}
    <div className="grid gap-3 sm:grid-cols-2">{follows.map(row => row.store && <article key={row.store_id} className="min-w-0 rounded-2xl border border-slate-200 p-4">
      <Link href={`/loja/${row.store.slug}`} className="flex min-h-11 items-center gap-3 font-bold text-blue-950">{row.store.logo_url && <CatalogImage src={row.store.logo_url} alt="" width={44} height={44} className="h-11 w-11 rounded-full object-cover" />}<span className="min-w-0 break-words">{row.store.nome_loja}</span></Link>
      <label className="mt-3 flex min-h-11 items-center gap-2 text-xs text-slate-700"><input type="checkbox" disabled={loading} checked={row.notifications_enabled} onChange={event => void update(row, true, event.target.checked)} className="h-4 w-4 accent-blue-700" />Mostrar novidades na minha área</label>
      <button type="button" disabled={loading} onClick={() => void update(row, false, false)} className="min-h-11 text-xs font-bold text-slate-500 underline">Deixar de seguir</button>
    </article>)}</div>
    {more && <button disabled={loading} onClick={() => void next()} className="min-h-11 rounded-xl border px-4 font-bold text-blue-800">Carregar mais lojas</button>}
    <div className="border-t border-slate-100 pt-5"><h3 className="flex items-center gap-2 font-bold text-slate-900"><Bell className="h-4 w-4 text-blue-700" />Novos materiais das lojas escolhidas</h3><p className="mt-1 text-xs text-slate-500">Materiais recentes dos últimos 30 dias, cadastrados depois que você começou a seguir. As novidades aparecem nesta área; nenhum e-mail ou WhatsApp é enviado automaticamente.</p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{news.map(item => <Link key={item.id} href={`/produto/${item.slug || item.id}`} className="overflow-hidden rounded-xl border border-slate-200">{item.capa_url && <CatalogImage src={item.capa_url} alt={`Capa de ${item.titulo}`} width={240} height={240} className="aspect-square w-full bg-slate-50 object-contain" />}<span className="block p-3 text-sm font-bold text-blue-950">{item.titulo}</span></Link>)}</div>
      {!loading && !news.length && <p className="mt-3 text-sm text-slate-500">Quando as lojas com novidades ativadas cadastrarem materiais, eles aparecerão aqui.</p>}
    </div>
  </section>;
}
