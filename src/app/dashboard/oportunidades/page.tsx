'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, RefreshCw, Sparkles } from 'lucide-react';
import { authenticatedFetch } from '@/lib/client-api';
import { readApiJson } from '@/lib/api-response';
import { buildCreatorOpportunities, opportunityToday, type OpportunityProduct } from '@/lib/creator-opportunities';
import OpportunityCard from './OpportunityCard';

const selectClass = 'mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800';
const months = Array.from({ length: 12 }, (_, i) => new Intl.DateTimeFormat('pt-BR', { month: 'long', timeZone: 'UTC' }).format(Date.UTC(2026, i, 1)));
export default function OpportunitiesPage() {
  const [products, setProducts] = useState<OpportunityProduct[]>([]);
  const [storeName, setStoreName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [lead, setLead] = useState(21);
  const [horizon, setHorizon] = useState(90);
  const [month, setMonth] = useState('all');
  const [onlyMine, setOnlyMine] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const pending = useRef<AbortController | null>(null);
  const refresh = useCallback(async () => {
    pending.current?.abort();
    const controller = new AbortController(); pending.current = controller;
    setLoading(true); setError('');
    const timeout = setTimeout(() => controller.abort(), 60000);
    try {
      const rows: OpportunityProduct[] = []; let after: string | null = null; let name = '';
      do {
        const response = await authenticatedFetch('/api/creator/opportunities' + (after ? '?after=' + encodeURIComponent(after) : ''), { signal: controller.signal });
        const data = await readApiJson(response);
        if (!response.ok) throw new Error(data.error || 'Não foi possível carregar o catálogo.');
        name = data.store.nome_loja; rows.push(...data.products); after = data.next;
      } while (after && !controller.signal.aborted);
      if (!controller.signal.aborted) { setProducts(rows); setStoreName(name); setLoaded(true); setNow(new Date()); }
    } catch (cause) {
      if (pending.current === controller) setError(controller.signal.aborted ? 'O carregamento demorou mais que o esperado. Tente atualizar o calendário.' : cause instanceof Error ? cause.message : 'Não foi possível carregar o calendário.');
    } finally { clearTimeout(timeout); if (pending.current === controller) setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); return () => { pending.current?.abort(); pending.current = null; }; }, [refresh]);
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(timer); }, []);
  const today = opportunityToday(now);
  const opportunities = useMemo(() => buildCreatorOpportunities(products, new Date(today + 12 * 3600000), lead), [products, today, lead]);
  const visible = opportunities.filter(item => item.daysUntil <= horizon && (month === 'all' || item.event.month === Number(month)) && (!onlyMine || item.matches.length > 0));
  const related = new Set(opportunities.flatMap(item => item.matches.map(match => match.product.id))).size;
  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); setNotice('Plano copiado! Cole na sua agenda ou na ferramenta que você usa para se organizar.'); } catch { setNotice('Não foi possível copiar. Você pode selecionar as etapas na tela e copiar manualmente.'); }
  }
  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 text-slate-900 md:px-8 md:py-8">
    <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-950 via-blue-800 to-violet-700 p-6 text-white sm:p-9"><p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold"><Sparkles className="h-4 w-4" /> Planejamento de {storeName || 'sua loja'}</p><h1 className="mt-5 flex items-center gap-3 text-2xl font-bold sm:text-3xl"><CalendarDays className="h-8 w-8 shrink-0" /> Calendário de oportunidades</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100 sm:text-base">Descubra quais materiais combinam com as próximas datas e prepare a divulgação antes de seus clientes começarem a procurar.</p><p className="mt-4 text-xs leading-6 text-blue-100">As sugestões usam o cadastro da sua loja. Nenhum produto é alterado e nenhuma mensagem é enviada automaticamente.</p></header>
    {error && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}{loaded && ' Os últimos dados carregados continuam abaixo.'}</div>}
    {notice && <div role="status" className="flex items-center justify-between gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900">{notice}<button type="button" className="font-bold underline" onClick={() => setNotice('')}>Fechar</button></div>}
    <section aria-label="Resumo do planejamento" className="grid gap-3 sm:grid-cols-3">{[
      ['Datas nos próximos 30 dias', opportunities.filter(item => item.daysUntil <= 30).length],
      ['Materiais relacionados no ano', related],
      ['Datas com divulgação no momento', opportunities.filter(item => item.start <= today && item.matches.some(match => match.product.status === 'publicado')).length],
    ].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-600">{label}</p><p className="mt-2 text-3xl font-bold text-blue-950">{loaded ? value : '—'}</p></div>)}</section>
    <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5" aria-label="Filtros do calendário"><div className="grid gap-4 sm:grid-cols-3"><label className="text-sm font-semibold">Período<select className={selectClass} value={horizon} onChange={event => setHorizon(Number(event.target.value))}><option value={30}>Próximos 30 dias</option><option value={90}>Próximos 90 dias</option><option value={366}>Próximos 12 meses</option></select></label><label className="text-sm font-semibold">Mês da oportunidade<select className={selectClass} value={month} onChange={event => { setMonth(event.target.value); if (event.target.value !== 'all') setHorizon(366); }}><option value="all">Todos os meses</option>{months.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}</select></label><label className="text-sm font-semibold">Começar a divulgar com<select className={selectClass} value={lead} onChange={event => setLead(Number(event.target.value))}>{[14, 21, 30, 45].map(days => <option key={days} value={days}>{days} dias de antecedência</option>)}</select></label></div><div className="flex flex-wrap items-center justify-between gap-4"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={onlyMine} onChange={event => setOnlyMine(event.target.checked)} className="h-4 w-4 accent-blue-700" /> Somente datas com materiais da minha loja</label><button type="button" onClick={() => void refresh()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-blue-800 disabled:opacity-50"><RefreshCw className={'h-4 w-4 ' + (loading ? 'animate-spin' : '')} />{loading ? 'Carregando…' : 'Atualizar catálogo'}</button></div></section>
    <p className="text-sm leading-6 text-slate-500">Datas de referência do calendário editorial da Educalizando. O plano é uma sugestão ajustável, sem garantia de vendas. Datas móveis, como Páscoa e Carnaval, ainda não fazem parte desta lista. As etapas seguem o horário de Brasília.</p>
    {loading && !loaded ? <div role="status" className="rounded-3xl bg-white p-12 text-center text-slate-500">Relacionando as datas aos seus materiais…</div> : loaded && <><p className="text-sm font-semibold text-slate-600">{visible.length} oportunidade(s) neste filtro</p>{visible.length ? visible.map(item => <OpportunityCard key={item.event.slug} opportunity={item} onCopy={copy} />) : <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center"><h2 className="font-bold">Nenhuma oportunidade neste filtro</h2><p className="mt-2 text-sm text-slate-600">Amplie o período ou desmarque o filtro de materiais. Para melhorar as associações, preencha as datas comemorativas no cadastro dos seus produtos.</p><button type="button" onClick={() => { setOnlyMine(false); setHorizon(366); setMonth('all'); }} className="mt-4 rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white">Ver todas as oportunidades do ano</button></div>}</>}
  </main>;
}
