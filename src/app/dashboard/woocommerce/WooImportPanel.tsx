'use client';
import { useCallback, useEffect, useState } from 'react';
import { authenticatedFetch } from '@/lib/client-api';
import { readApiJson } from '@/lib/api-response';
import { Download, Loader2, Pause, Play, RefreshCw } from 'lucide-react';
type Product = { id: number; name: string; price: number; alreadyImported: boolean };
type Job = { id: string; status: string; mode: string; processed: number; failed: number; skipped: number; discovered: number; warnings: number; last_error: string | null; issues: { product: number; stage: string; message: string }[] };
async function api(path: string, body?: unknown) {
  const response = await authenticatedFetch('/api/creator/woocommerce/' + path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {});
  const data = await readApiJson(response); if (!response.ok) throw new Error(data.error || 'Não foi possível concluir a etapa.'); return data;
}
const labels: Record<string, string> = { queued: 'Na fila', running: 'Importando', paused: 'Pausada', completed: 'Finalizada', cancelled: 'Cancelada' };
export default function WooImportPanel({ enabled, onFinished }: { enabled: boolean; onFinished: () => void }) {
  const [job, setJob] = useState<Job | null>(null), [available, setAvailable] = useState(false), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState(''), [hold, setHold] = useState(false);
  const [products, setProducts] = useState<Product[]>([]), [page, setPage] = useState(0), [hasMore, setHasMore] = useState(false), [selected, setSelected] = useState<number[]>([]);
  const running = job?.status === 'queued' || job?.status === 'running';
  const active = running || job?.status === 'paused';
  const refresh = useCallback(async () => { const data = await api('import-jobs'); setAvailable(data.available); setJob(data.jobs?.find((item: Job) => ['queued', 'running', 'paused'].includes(item.status)) || data.jobs?.[0] || null); }, []);
  useEffect(() => { void refresh().catch(cause => setError(cause.message)).finally(() => setLoading(false)); }, [refresh]);
  useEffect(() => {
    if (!running || !job || hold || !enabled) return;
    const id = job.id; let mounted = true, failures = 0, timer: ReturnType<typeof setTimeout> | undefined;
    async function tick() {
      try {
        const data = await api('import-jobs', { action: 'step', id }); if (!mounted) return;
        failures = 0; setJob(data.job); setError('');
        if (!['queued', 'running'].includes(data.job.status)) { if (data.job.status === 'completed') onFinished(); return; }
        timer = setTimeout(() => void tick(), data.waitMs || 750);
      } catch (cause) {
        if (!mounted) return;
        setError(cause instanceof Error ? cause.message : 'O acompanhamento falhou. O progresso salvo permanece disponível.');
        if (++failures >= 3) { setHold(true); return; }
        timer = setTimeout(() => void tick(), 5000);
      }
    }
    void tick(); return () => { mounted = false; if (timer) clearTimeout(timer); };
  }, [job?.id, running, hold, enabled, onFinished]);
  async function act(action: string, mode?: string) {
    setBusy(true); setError('');
    try { const data = await api('import-jobs', action === 'create' ? { action, mode, ids: selected } : { action, id: job?.id }); setJob(data.job); setHold(false); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível iniciar.'); } finally { setBusy(false); }
  }
  async function catalog(next: number) {
    setBusy(true); setError('');
    try { const data = await api('catalog?page=' + next); setProducts(data.products); setPage(next); setHasMore(data.hasMore); setSelected([]); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível carregar o catálogo.'); } finally { setBusy(false); }
  }
  return <section id="woo-import-panel" className="scroll-mt-6 space-y-5 rounded-3xl border-2 border-violet-200 bg-white p-5 shadow-sm sm:p-7"><header><h2 className="flex items-center gap-2 text-xl font-black text-slate-950"><Download className="h-6 w-6 text-violet-700" />Importar produtos do WooCommerce</h2><p className="mt-2 text-sm leading-6 text-slate-600">Uma única ação percorre o catálogo inteiro. Produtos e arquivos são processados em etapas pequenas, com progresso salvo. Os materiais entram como rascunho para você revisar preço, imagens e entrega antes de publicar.</p></header>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
    {loading ? <p role="status">Consultando importações…</p> : !available ? <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">A importação contínua aguarda ativação pela administração da plataforma.</p> : <>
    {!enabled && <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Ative a integração e a opção Woo → Educalizando para importar.</p>}
    <div className="flex flex-wrap gap-3"><button type="button" disabled={!enabled || busy || active} onClick={() => void act('create', 'all')} className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-40"><Download className="h-4 w-4" />Importar todo o catálogo</button><button type="button" disabled={!enabled || busy || active} onClick={() => void catalog(1)} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 disabled:opacity-40">Escolher produtos</button><button type="button" disabled={busy} onClick={() => void refresh().catch(cause => setError(cause.message))} className="inline-flex items-center gap-2 px-3 text-sm font-bold text-violet-700"><RefreshCw className="h-4 w-4" />Atualizar progresso</button></div>
    {job && <div className="space-y-4 rounded-2xl border border-violet-100 bg-violet-50 p-5"><div className="flex items-center gap-2 font-bold text-violet-950">{running && !hold && <Loader2 className="h-4 w-4 animate-spin" />}{labels[job.status]} · {job.mode === 'all' ? 'Catálogo completo' : 'Produtos escolhidos'}</div><div aria-live="polite" className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">{[['Localizados', job.discovered], ['Importados', job.processed], ['Já existentes', job.skipped], ['Falhas', job.failed], ['Avisos de arquivos', job.warnings]].map(([name, value]) => <p key={name} className="rounded-xl bg-white p-3 text-slate-600">{name}<strong className="mt-1 block text-xl text-slate-950">{Number(value).toLocaleString('pt-BR')}</strong></p>)}</div><p className="text-xs leading-6 text-violet-900">Na importação completa, itens já vinculados são pulados. Para revisar um rascunho importado com arquivos pendentes, use Escolher produtos. Você pode fechar a página: a fila fica salva e continua em segundo plano, em ritmo menor. Ao voltar, o acompanhamento acelera o processamento.</p>{job.last_error && <p role="status" className="text-sm text-amber-900">{job.last_error}</p>}<div className="flex flex-wrap gap-2">{running && <button disabled={busy} onClick={() => void act('pause')} className="inline-flex items-center gap-1 rounded-xl border border-violet-200 bg-white px-4 py-2 text-sm font-bold text-violet-800"><Pause className="h-4 w-4" />Pausar</button>}{job.status === 'paused' && <button disabled={busy || !enabled} onClick={() => void act('resume')} className="inline-flex items-center gap-1 rounded-xl bg-violet-700 px-4 py-2 text-sm font-bold text-white"><Play className="h-4 w-4" />Retomar</button>}{hold && running && <button onClick={() => setHold(false)} className="rounded-xl bg-violet-700 px-4 py-2 text-sm font-bold text-white">Retomar acompanhamento</button>}{active && <button disabled={busy} onClick={() => void act('cancel')} className="rounded-xl px-4 py-2 text-sm font-bold text-rose-700">Cancelar fila</button>}</div>{job.issues?.length > 0 && <details><summary className="cursor-pointer text-sm font-bold text-violet-900">Ver os últimos avisos e falhas</summary><ul className="mt-3 space-y-2 text-sm text-slate-700">{job.issues.map((issue, i) => <li key={i} className="rounded-lg bg-white p-3">Produto Woo #{issue.product} · {issue.stage}: {issue.message}</li>)}</ul></details>}</div>}
    {page > 0 && !active && <div className="space-y-4 border-t border-slate-200 pt-5"><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-bold">Página {page} · {selected.length} selecionado(s)</p><button disabled={busy} onClick={() => setSelected(selected.length === products.length ? [] : products.map(product => product.id))} className="text-sm font-bold text-violet-700">{selected.length === products.length ? 'Limpar seleção' : 'Marcar esta página'}</button></div><div className="grid max-h-96 gap-3 overflow-y-auto sm:grid-cols-2">{products.map(product => <label key={product.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4"><input type="checkbox" disabled={busy} checked={selected.includes(product.id)} onChange={() => setSelected(ids => ids.includes(product.id) ? ids.filter(id => id !== product.id) : [...ids, product.id])} className="mt-1 h-4 w-4 accent-violet-700" /><span className="text-sm"><strong>{product.name}</strong><span className="mt-1 block text-slate-500">{Number(product.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} · {product.alreadyImported ? 'Já importado: revisar arquivos pendentes' : 'Novo material'}</span></span></label>)}</div>{!products.length && <p className="text-sm text-slate-500">Nenhum produto nesta página.</p>}<div className="flex flex-wrap gap-2"><button disabled={busy || page <= 1} onClick={() => void catalog(page - 1)} className="rounded-xl border px-4 py-2 text-sm disabled:opacity-40">Anterior</button><button disabled={busy || !hasMore} onClick={() => void catalog(page + 1)} className="rounded-xl border px-4 py-2 text-sm disabled:opacity-40">Próxima página</button><button disabled={busy || !selected.length || !enabled} onClick={() => void act('create', 'selected')} className="rounded-xl bg-violet-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-40">Importar selecionados</button></div></div>}
    </>}
  </section>;
}
