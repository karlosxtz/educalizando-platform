'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Copy, Download, Lightbulb, Plus, RefreshCw, SearchX, ShieldCheck } from 'lucide-react';
import { authenticatedFetch } from '@/lib/client-api';
import { readApiJson } from '@/lib/api-response';
import { gapSuggestion, type SearchGapReport } from '@/lib/store-search-gaps';

const control = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800';
export default function SearchGapsPage() {
  const [report, setReport] = useState<SearchGapReport | null>(null);
  const [days, setDays] = useState(30);
  const [scope, setScope] = useState('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 30000);
    setLoading(true); setError(''); setReport(null);
    void (async () => {
      try {
        const response = await authenticatedFetch(`/api/creator/search-gaps?days=${days}&scope=${scope}`, { signal: controller.signal });
        const data = await readApiJson(response);
        if (!response.ok) throw new Error(data.error || 'Não foi possível carregar as buscas.');
        if (active && !controller.signal.aborted) setReport(data);
      } catch (cause) {
        if (active) setError(controller.signal.aborted ? 'O carregamento demorou mais que o esperado. Tente atualizar o relatório.' : cause instanceof Error ? cause.message : 'Não foi possível carregar as buscas.');
      } finally { clearTimeout(timer); if (active) setLoading(false); }
    })();
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [days, scope, revision]);
  const terms = (report?.terms || []).filter(item => item.term.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR').trim()));
  const copy = useCallback(async (term: string) => {
    try { await navigator.clipboard.writeText(term); setNotice(`Tema copiado: ${term}`); } catch { setNotice('Selecione o termo na tela e copie manualmente.'); }
  }, []);
  function exportCsv() {
    const cell = (value: string | number) => '"' + String(value).replace(/^[=+@-]/, "'$&").replace(/"/g, '""') + '"';
    const rows = [['Termo', 'Buscas sem resultado', 'Sem correspondência no catálogo', 'Com filtros', 'Última busca'], ...terms.map(item => [item.term, item.count, item.catalog_count, item.filtered_count, item.last_seen])];
    const blob = new Blob(['\ufeff' + rows.map(row => row.map(cell).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = `buscas-sem-resultado-${days}-dias.csv`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 text-slate-900 md:px-8 md:py-8">
    <header className="rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-700 p-6 text-white sm:p-9"><p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold"><ShieldCheck className="h-4 w-4" /> Relatório privado de {report?.store.nome_loja || 'sua loja'}</p><h1 className="mt-5 flex items-center gap-3 text-2xl font-bold sm:text-3xl"><SearchX className="h-8 w-8 shrink-0" /> Buscas sem resultado</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100 sm:text-base">Veja o que seus visitantes procuram e não encontram. Use esses sinais para revisar o catálogo e descobrir temas para seus próximos materiais.</p></header>
    {error && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</div>}
    {notice && <div role="status" className="flex items-center justify-between gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900">{notice}<button type="button" onClick={() => setNotice('')} className="font-bold underline">Fechar</button></div>}
    <section aria-label="Filtros do relatório" className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 sm:grid-cols-[1fr_1fr_auto]"><label className="space-y-2 text-sm font-semibold"><span>Período</span><select className={control} value={days} onChange={event => setDays(Number(event.target.value))}>{[7, 30, 90].map(value => <option key={value} value={value}>Últimos {value} dias</option>)}</select></label><label className="space-y-2 text-sm font-semibold"><span>Tipo de busca sem resultado</span><select className={control} value={scope} onChange={event => setScope(event.target.value)}><option value="all">Todas</option><option value="catalog">Sem correspondência no catálogo</option><option value="filters">Sem resultado por causa dos filtros</option></select></label><button type="button" disabled={loading} onClick={() => setRevision(value => value + 1)} className="inline-flex items-center justify-center gap-2 self-end rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-blue-800 disabled:opacity-50"><RefreshCw className={'h-4 w-4 ' + (loading ? 'animate-spin' : '')} />Atualizar</button></section>
    {loading && <p role="status" className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500">Carregando as buscas da loja…</p>}
    {!loading && report?.available === false && <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6"><h2 className="font-bold text-amber-950">Relatório aguardando ativação</h2><p className="mt-2 text-sm leading-6 text-amber-900">A coleta ainda não foi ativada pela administração da plataforma. Quando estiver disponível, as novas buscas começarão a aparecer aqui.</p></section>}
    {!loading && report?.available && <>
      <section aria-label="Resumo das buscas" className="grid gap-3 sm:grid-cols-3">{[['Buscas sem resultado', report.total], ['Sem correspondência no catálogo', report.catalog_total], ['Resultado vazio com filtros', report.filtered_total]].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-600">{label}</p><p className="mt-2 text-3xl font-bold text-blue-950">{Number(value).toLocaleString('pt-BR')}</p></div>)}</section>
      <aside className="flex gap-3 rounded-2xl border border-violet-100 bg-violet-50 p-5"><Lightbulb className="mt-1 h-5 w-5 shrink-0 text-violet-700" /><div><h2 className="text-sm font-bold text-violet-950">Antes de produzir, confira o que já existe</h2><p className="mt-1 text-sm leading-6 text-violet-900">Uma busca vazia pode indicar um novo tema ou um material difícil de encontrar. Confira título, tags, categorias e níveis de ensino. Se houve filtros, o material pode já estar disponível em outra classificação.</p></div></aside>
      {report.total === 0 ? <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center"><SearchX className="mx-auto h-10 w-10 text-blue-300" /><h2 className="mt-4 text-lg font-bold">Nenhuma busca sem resultado registrada neste filtro</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">O relatório começa a reunir dados a partir da ativação. Ele considera as buscas feitas dentro da sua loja; não recupera buscas antigas nem mistura pesquisas de outras lojas.</p><button type="button" onClick={() => { setDays(90); setScope('all'); }} className="mt-4 text-sm font-bold text-blue-700 underline">Ver todos os tipos nos últimos 90 dias</button></section> : <section className="space-y-4"><div className="flex flex-wrap items-end justify-between gap-4"><label className="w-full max-w-md space-y-2 text-sm font-semibold"><span>Localizar termo no relatório</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Ex.: alfabetização" className={control} /></label><button type="button" onClick={exportCsv} disabled={!terms.length} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 disabled:opacity-50"><Download className="h-4 w-4" />Exportar lista exibida</button></div><p className="text-sm text-slate-500">{report.distinct_terms} termo(s) no período. Exibindo {terms.length} entre os 100 mais frequentes.</p>{terms.length === 0 && <p className="rounded-2xl bg-white p-6 text-sm text-slate-500">Nenhum termo desta lista corresponde ao filtro de texto.</p>}{terms.map(item => <article key={item.term} className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6"><div className="flex flex-wrap justify-between gap-3"><h2 className="break-words text-xl font-bold text-slate-950">“{item.term}”</h2><span className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-800">{item.count} busca(s)</span></div><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500"><p>{item.catalog_count} sem correspondência no catálogo</p><p>{item.filtered_count} com filtros</p><p>Última busca: {new Date(item.last_seen).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p></div><p className="mt-4 text-sm leading-6 text-slate-600">{gapSuggestion(item)}</p><div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={() => void copy(item.term)} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white"><Copy className="h-4 w-4" />Copiar tema</button><Link href="/dashboard/produtos" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700">Revisar catálogo</Link><Link href="/dashboard/produtos/novo" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700"><Plus className="h-4 w-4" />Criar material</Link></div></article>)}</section>}
      <p className="text-xs leading-6 text-slate-500">Os números representam buscas registradas, não visitantes únicos. Pesquisas iguais na mesma sessão e com os mesmos filtros são limitadas a uma a cada 30 minutos. Buscas vazias, digitação rápida e sinais comuns de dados pessoais são descartados. Termos com ou sem acento são agrupados. As contagens refletem o resultado exibido no momento da busca.</p>
    </>}
  </main>;
}
