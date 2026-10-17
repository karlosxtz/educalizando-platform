'use client';

import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Activity, ArrowUpRight, CheckCircle2, Copy, KeyRound, Link2, Pause, Play, Plus, Settings2, ShieldCheck, Webhook } from 'lucide-react';
import { authenticatedFetch } from '@/lib/client-api';
import { STORE_WEBHOOK_EVENTS, UTMIFY_EVENTS } from '@/lib/store-webhook-contract';
import WebhookGuide, { WebhookIntro } from './WebhookGuide';
import WebhookSetupForm from './WebhookSetupForm';
import WebhookHistory from './WebhookHistory';
import { button, initialForm, primaryButton, statusLabels, type ConnectionForm, type Endpoint, type Snapshot } from './webhook-ui';

const WebhookReceivers = lazy(() => import('./WebhookReceivers'));

async function api(method = 'GET', body?: unknown) {
  const response = await authenticatedFetch('/api/creator/webhooks', { method, ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(30000) });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || 'Não foi possível concluir agora. Seus dados preenchidos foram mantidos. Tente novamente.');
  if (data?.schemaReady === false) throw new Error('O recurso ainda não está disponível. Entre em contato com o suporte da Educalizando.');
  return data;
}
function jump(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
}
function destinationLabel(url: string) {
  try { return new URL(url).hostname; } catch { return 'Endereço cadastrado'; }
}

export default function WebhooksPage() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [form, setForm] = useState<ConnectionForm>(initialForm);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [secret, setSecret] = useState('');
  const [direction, setDirection] = useState<'send' | 'receive'>('send');
  useEffect(() => { if (window.location.hash === '#receber') setDirection('receive'); }, []);
  const refresh = useCallback(async () => { setSnapshot(await api()); }, []);
  useEffect(() => { refresh().catch(e => setError(e.message)); }, [refresh]);
  useEffect(() => {
    if (!editing) return;
    const frame = requestAnimationFrame(() => jump('webhook-setup'));
    return () => cancelAnimationFrame(frame);
  }, [editing]);
  useEffect(() => {
    if (!secret) return;
    const frame = requestAnimationFrame(() => jump('webhook-secret'));
    return () => cancelAnimationFrame(frame);
  }, [secret]);
  async function run(work: () => Promise<void>) {
    if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try { await work(); await refresh(); } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível concluir.'); } finally { setBusy(false); }
  }
  const action = (method: string, body: unknown, message: string) => run(async () => {
    const result = await api(method, body);
    if (result.signingSecret && result.endpoint?.provider === 'generic') setSecret(result.signingSecret);
    setNotice(message);
  });
  function start(provider: 'generic' | 'utmify') {
    setForm({ ...initialForm(), provider, name: provider === 'utmify' ? 'UTMify da minha loja' : '', events: provider === 'utmify' ? [...UTMIFY_EVENTS] : ['order.paid'] });
    setEditing(true); setError('');
    if (editing) jump('webhook-setup');
  }
  function edit(endpoint: Endpoint) {
    setForm({ id: endpoint.id, name: endpoint.name, provider: endpoint.provider, url: endpoint.url, apiToken: '', events: endpoint.events, includeCustomer: endpoint.include_customer });
    setEditing(true); setError('');
    if (editing) jump('webhook-setup');
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    await run(async () => {
      const result = await api(form.id ? 'PATCH' : 'POST', form);
      if (result.signingSecret && result.endpoint?.provider === 'generic') setSecret(result.signingSecret);
      setForm(initialForm()); setEditing(false);
      setNotice(result.endpoint?.enabled === false ? 'Alterações salvas. Os envios continuam pausados; use Ativar integração quando quiser retomar.' : 'Tudo salvo! Os próximos avisos selecionados serão enviados automaticamente. Agora use Testar conexão e confira o recebimento no histórico.');
    });
  }
  async function copy(value: string, message: string) {
    try { await navigator.clipboard.writeText(value); setNotice(message); } catch { setError('Não foi possível copiar automaticamente. Selecione o texto e copie manualmente.'); }
  }
  const active = snapshot?.endpoints.filter(endpoint => endpoint.enabled).length;
  const delivered = snapshot?.deliveries.filter(delivery => delivery.status === 'delivered').length;
  const failed = snapshot?.deliveries.filter(delivery => delivery.status === 'failed').length;
  const directionTabs = <nav aria-label="Direção dos webhooks" className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2"><button type="button" aria-pressed={direction === 'send'} className={'flex-1 rounded-xl px-5 py-3 text-sm font-bold transition ' + (direction === 'send' ? 'bg-blue-700 text-white' : 'text-slate-600 hover:bg-slate-50')} onClick={() => setDirection('send')}>Enviar dados · Educalizando → outras plataformas</button><button type="button" aria-pressed={direction === 'receive'} className={'flex-1 rounded-xl px-5 py-3 text-sm font-bold transition ' + (direction === 'receive' ? 'bg-violet-800 text-white' : 'text-slate-600 hover:bg-slate-50')} onClick={() => setDirection('receive')}>Receber dados · gerar webhook da minha loja</button></nav>;
  if (direction === 'receive') return <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 text-slate-900 md:px-8 md:py-8">{directionTabs}<Suspense fallback={<p role="status" className="p-6 text-sm text-slate-500">Carregando recebimento de dados…</p>}><WebhookReceivers /></Suspense></main>;
  return <main className="mx-auto max-w-6xl space-y-7 px-4 py-6 text-slate-900 md:px-8 md:py-8">
    {directionTabs}
    <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 px-6 py-8 text-white sm:px-9 sm:py-10">
      <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-[35px] border-white/5" aria-hidden="true" />
      <div className="relative flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-2xl"><p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-100"><ShieldCheck className="h-3.5 w-3.5" /> Conexões privadas de {snapshot?.store.nome_loja || 'sua loja'}</p><h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight sm:text-3xl"><Webhook className="h-7 w-7 shrink-0 text-blue-300" /> Webhooks e integrações</h1><p className="mt-3 max-w-xl text-sm leading-7 text-blue-100 sm:text-base">Leve os avisos de vendas e novidades da sua loja para as ferramentas que você usa. Configure uma vez e acompanhe os envios por aqui.</p></div>
        <button disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-950 shadow-sm transition hover:bg-blue-50 disabled:opacity-50" onClick={() => start('generic')}><Plus className="h-4 w-4" /> Nova conexão</button>
      </div>
    </header>
    {(error || notice) && <div className="sticky top-4 z-20 space-y-2">
      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 shadow-sm">{error} {!snapshot && <button className="ml-2 font-bold underline" disabled={busy} onClick={() => run(async () => {})}>Recarregar</button>}</div>}
      {notice && <div role="status" className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900 shadow-sm"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{notice}</div>}
    </div>}
    <div className="grid gap-3 sm:grid-cols-3">{[
      ['Envios habilitados', active, 'Conexões ativas para enviar novos avisos', Link2],
      ['Recebidos pelo destino', delivered, 'Entre as últimas 50 entregas', CheckCircle2],
      ['Precisam de atenção', failed, 'Falhas entre as últimas 50 entregas', Activity],
    ].map(([label, value, description, Icon]) => { const MetricIcon = Icon as typeof Link2; return <div key={String(label)} className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5"><div><p className="text-xs font-semibold text-slate-500">{String(label)}</p><p className="mt-2 text-2xl font-bold text-slate-900">{typeof value === 'number' ? value : '—'}</p><p className="mt-1 text-xs text-slate-400">{String(description)}</p></div><span className="rounded-xl bg-slate-50 p-2.5 text-blue-600"><MetricIcon className="h-5 w-5" /></span></div>; })}</div>
    <WebhookIntro onConnect={start} onHelp={() => jump('webhook-guide')} busy={busy} />
    {secret && <section id="webhook-secret" className="scroll-mt-6 space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <h2 className="flex items-center gap-2 font-bold text-amber-950"><KeyRound className="h-5 w-5" /> Chave de segurança da sua conexão</h2><p className="text-sm leading-6 text-amber-900">Guarde esta chave se a pessoa que configura sua automação precisar validar os envios. Ela aparece somente agora. A UTMify usa a credencial cadastrada e não precisa desta chave.</p>
      <input readOnly aria-label="Chave de segurança da conexão" className="w-full rounded-xl border border-amber-200 bg-white p-3 font-mono text-xs" value={secret} />
      <div className="flex flex-wrap gap-2"><button className={button} onClick={() => copy(secret, 'Chave de segurança copiada. Guarde em um local seguro.')}><Copy className="h-4 w-4" /> Copiar chave</button><button className={button} onClick={() => setSecret('')}>Já guardei</button></div>
    </section>}
    {editing && <WebhookSetupForm form={form} setForm={setForm} busy={busy} onSubmit={save} onCancel={() => setEditing(false)} />}
    <section id="webhook-connections" className="scroll-mt-6 space-y-4">
      <div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-bold text-slate-900">Minhas conexões</h2><p className="mt-1 text-sm text-slate-500">{snapshot ? snapshot.endpoints.length + ' de 10 conexões cadastradas' : 'Suas plataformas conectadas aparecem aqui.'}</p></div><button className="text-sm font-semibold text-blue-700 hover:underline" onClick={() => jump('webhook-history')}>Ver envios</button></div>
      {!snapshot && !error && <p role="status" className="rounded-2xl bg-white p-6 text-sm text-slate-500">Carregando suas conexões…</p>}
      {snapshot?.endpoints.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-9 text-center"><Link2 className="mx-auto h-8 w-8 text-slate-300" /><h3 className="mt-3 font-bold">Sua primeira conexão começa aqui</h3><p className="mx-auto mb-5 mt-2 max-w-lg text-sm leading-6 text-slate-500">Escolha a plataforma nos cartões acima. Depois de salvar, ela aparecerá aqui com as opções de testar, editar e pausar.</p><button className={primaryButton} disabled={busy} onClick={() => start('utmify')}>Conectar UTMify <ArrowUpRight className="h-4 w-4" /></button></div>}
      {snapshot?.endpoints.map(endpoint => { const last = snapshot.deliveries.find(delivery => delivery.endpoint_id === endpoint.id); return <article key={endpoint.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="space-y-5 p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div className="flex min-w-0 items-center gap-3"><span className={'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ' + (endpoint.provider === 'utmify' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700')}><Webhook className="h-6 w-6" /></span><div className="min-w-0"><h3 className="break-words font-bold text-slate-900">{endpoint.name}</h3><p className="mt-1 text-xs text-slate-500">{endpoint.provider === 'utmify' ? 'UTMify · credencial protegida' : destinationLabel(endpoint.url)}</p></div></div><span className={'rounded-full px-3 py-1.5 text-xs font-bold ' + (endpoint.enabled ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-500')}>{endpoint.enabled ? 'Envios habilitados' : 'Envios pausados'}</span></div>
          {endpoint.provider === 'generic' && <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3"><label className="min-w-0 flex-1 text-xs font-medium text-slate-500">Endereço do destino<input readOnly aria-label={'Endereço de destino de ' + endpoint.name} value={endpoint.url} className="mt-1 w-full bg-transparent text-xs text-slate-700 outline-none" /></label><button className={button} aria-label={'Copiar endereço de destino de ' + endpoint.name} onClick={() => copy(endpoint.url, 'Endereço do destino copiado.')}><Copy className="h-4 w-4" /></button></div>}
          <div className="flex flex-wrap gap-2">{endpoint.events.slice(0, 3).map(type => <span key={type} className="rounded-lg bg-slate-50 px-2.5 py-1 text-xs text-slate-600">{STORE_WEBHOOK_EVENTS[type]}</span>)}{endpoint.events.length > 3 && <span className="rounded-lg bg-slate-50 px-2.5 py-1 text-xs text-slate-500">+{endpoint.events.length - 3} avisos</span>}</div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"><p className="text-xs text-slate-500">{last ? 'Último envio: ' + (statusLabels[last.status] || last.status) : 'Recebimento ainda não verificado. Use Testar conexão.'}</p><div className="flex flex-wrap gap-2"><button disabled={busy} className={button} onClick={() => edit(endpoint)}><Settings2 className="h-4 w-4" /> Editar</button><button disabled={busy || !endpoint.enabled} className={primaryButton} onClick={() => action('POST', { action: 'test', id: endpoint.id }, 'Teste solicitado com dados fictícios. Confira o histórico: Recebido pelo destino confirma que a plataforma aceitou o envio.')} aria-describedby={'test-help-' + endpoint.id}>Testar conexão</button></div></div>
          <p id={'test-help-' + endpoint.id} className="text-xs leading-5 text-slate-400">O teste faz uma conexão real com dados fictícios, sem cobrança ou venda na Educalizando. Pode acionar automações no destino.{!endpoint.enabled && ' Ative os envios antes de testar.'}</p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-3 sm:px-6"><button disabled={busy} className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-700 disabled:opacity-50" onClick={() => action('PATCH', { id: endpoint.id, enabled: !endpoint.enabled }, endpoint.enabled ? 'Envios pausados. Os que já estavam em andamento podem terminar.' : 'Envios ativados para os próximos eventos reais. Use Testar conexão para conferir o destino.')}>{endpoint.enabled ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}{endpoint.enabled ? 'Pausar integração' : 'Ativar integração'}</button><details className="text-xs text-slate-500"><summary className="cursor-pointer font-semibold">Mais opções</summary><div className="mt-3 flex flex-wrap gap-3">{endpoint.provider === 'generic' && <button disabled={busy} className="font-semibold hover:text-blue-700 disabled:opacity-50" onClick={() => { if (window.confirm('Gerar uma nova chave de segurança? Atualize também a automação que usa a chave atual. Envios pendentes da chave anterior serão cancelados.')) void action('PATCH', { id: endpoint.id, rotateSecret: true }, 'Nova chave de segurança gerada. Atualize a configuração na sua automação.'); }}>Renovar chave de segurança</button>}<button disabled={busy} className="font-semibold text-rose-700 disabled:opacity-50" onClick={() => { if (window.confirm('Excluir esta conexão e seu histórico de envios?')) void action('DELETE', { id: endpoint.id }, 'Conexão excluída.'); }}>Excluir conexão</button></div></details></div>
      </article>; })}
    </section>
    <WebhookHistory deliveries={snapshot?.deliveries || []} endpoints={snapshot?.endpoints || []} busy={busy} loading={!snapshot && !error} onRefresh={() => run(async () => { setNotice('Resultados atualizados.'); })} onProcess={() => run(async () => { await api('POST', { action: 'process' }); setNotice('Pendências processadas. Confira os resultados no histórico.'); })} onRetry={id => action('POST', { action: 'retry', id }, 'Nova tentativa solicitada. Confira o resultado no histórico.')} />
    <WebhookGuide />
  </main>;
}
