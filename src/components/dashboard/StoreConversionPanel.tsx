'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3, RefreshCw } from 'lucide-react';
import { customerApi } from '@/lib/customer-api';

type Row = { productId: string; title: string; slug: string | null; views: number; carts: number; checkouts: number; purchases: number };
export default function StoreConversionPanel({ storeId }: { storeId: string }) {
  const [days, setDays] = useState(30); const [refresh, setRefresh] = useState(0);
  const [rows, setRows] = useState<Row[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController(); let active = true;
    setLoading(true); setError('');
    void customerApi(`/api/dashboard/conversion?storeId=${encodeURIComponent(storeId)}&days=${days}`, { signal: controller.signal }).then(data => { if (active) setRows(data.products); }).catch(err => { if (active) setError(err instanceof Error ? err.message : 'Não foi possível carregar o painel.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [storeId, days, refresh]);
  const totals = rows.reduce((sum, row) => ({ views: sum.views + row.views, carts: sum.carts + row.carts, checkouts: sum.checkouts + row.checkouts, purchases: sum.purchases + row.purchases }), { views: 0, carts: 0, checkouts: 0, purchases: 0 });
  return <section className="space-y-5 rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-7">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="flex items-center gap-2 text-xl font-black text-slate-950"><BarChart3 className="h-5 w-5 text-blue-700" />Da visita à compra</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Veja onde cada material desperta interesse e quais tiveram compras confirmadas.</p></div><div className="flex items-center gap-2"><label className="sr-only" htmlFor="conversion-period">Período dos indicadores</label><select id="conversion-period" value={days} onChange={event => setDays(Number(event.target.value))} className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm"><option value={7}>Últimos 7 dias</option><option value={30}>Últimos 30 dias</option></select><button disabled={loading} onClick={() => setRefresh(value => value + 1)} aria-label="Atualizar indicadores de conversão" className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-blue-800 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button></div></div>
    {loading ? <p role="status" className="text-sm text-slate-500">Carregando indicadores reais…</p> : error ? <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800">{error}</p> : <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{([['Visualizações', totals.views], ['Adições ao carrinho', totals.carts], ['Inícios de checkout', totals.checkouts], ['Compras confirmadas', totals.purchases]] as const).map(([label, count]) => <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-600">{label}</p><p className="mt-2 text-2xl font-black text-blue-950">{count.toLocaleString('pt-BR')}</p></div>)}</div>
      <p className="rounded-xl bg-blue-50 p-4 text-xs leading-6 text-blue-950">Navegação medida apenas com consentimento, a partir da ativação deste recurso. Cada etapa conta sessões por material; uma sessão que interage com dois materiais conta duas vezes no total. Compras são pedidos pagos do período e podem vir de visitas não medidas. Os números não representam uma mesma coorte nem provam a origem orgânica de uma venda. Inclui produto final e PLR; combos, clubes e encomendas ficam fora deste painel.</p>
      {!rows.length ? <p className="py-6 text-center text-sm text-slate-500">Ainda não há eventos medidos ou compras de materiais neste período.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><caption className="sr-only">Indicadores por material nos últimos {days} dias</caption><thead><tr className="border-b text-xs text-slate-500">{['Material', 'Visualizações', 'Carrinho', 'Checkout', 'Compras'].map(label => <th scope="col" key={label} className="px-2 py-3">{label}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.productId} className="border-b border-slate-100"><th scope="row" className="max-w-sm px-2 py-4 font-semibold text-slate-900">{row.slug ? <Link href={`/produto/${row.slug}`} className="text-blue-800 hover:underline">{row.title}</Link> : row.title}{row.views >= 10 && !row.carts && <p className="mt-1 text-xs font-normal text-slate-500">Revise capa, prévia e clareza do que está incluído.</p>}</th><td className="px-2 py-4">{row.views}</td><td className="px-2 py-4">{row.carts}</td><td className="px-2 py-4">{row.checkouts}</td><td className="px-2 py-4 font-bold text-emerald-800">{row.purchases}</td></tr>)}</tbody></table></div>}
    </>}
  </section>;
}
