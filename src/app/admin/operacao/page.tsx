'use client';

import Link from 'next/link';
import { Activity, AlertTriangle, CheckCircle2, RefreshCw, ServerCrash, Wrench } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

type HealthStatus = 'healthy' | 'warning' | 'error';
type Service = { id: string; label: string; status: HealthStatus; message: string; href?: string };
type HealthResponse = { checkedAt: string; services: Service[] };

const visual = {
  healthy: { icon: CheckCircle2, title: 'Operacional', card: 'border-emerald-500/30 bg-emerald-500/5', badge: 'bg-emerald-500/15 text-emerald-300' },
  warning: { icon: AlertTriangle, title: 'Atenção', card: 'border-amber-500/30 bg-amber-500/5', badge: 'bg-amber-500/15 text-amber-300' },
  error: { icon: ServerCrash, title: 'Erro', card: 'border-rose-500/30 bg-rose-500/5', badge: 'bg-rose-500/15 text-rose-300' },
} as const;

export default function AdminOperationPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/admin/platform-health', { cache: 'no-store' });
      const data = await response.json().catch(() => null) as HealthResponse & { error?: string } | null;
      if (!response.ok || !data?.services) throw new Error(data?.error || 'Não foi possível consultar a integridade da plataforma.');
      setHealth(data);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível consultar a integridade da plataforma.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);
  const errors = health?.services.filter(service => service.status === 'error').length || 0;
  const warnings = health?.services.filter(service => service.status === 'warning').length || 0;
  const overall = errors ? 'Há serviços que precisam de correção imediata.' : warnings ? 'A plataforma está funcionando, mas existem pontos para revisar.' : 'Todos os serviços verificados estão operacionais.';

  return <div className="space-y-6">
    <section className="rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-950 via-slate-950 to-slate-950 p-6 shadow-xl shadow-cyan-950/20">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-black uppercase tracking-widest text-cyan-300">Monitoramento real</p><h1 className="mt-1 flex items-center gap-3 text-3xl font-black text-white"><Activity className="h-8 w-8 text-cyan-300" />Integridade da plataforma</h1><p className="mt-2 max-w-2xl text-sm text-slate-300">Verifique a conexão com banco, checkout, Resend, WhatsApp e as entregas automáticas sem expor chaves ou dados sensíveis.</p></div><button type="button" onClick={() => void load()} disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-wait disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Atualizar agora</button></div>
      {health && <div className="mt-5 rounded-xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-200"><strong>{overall}</strong><span className="ml-2 text-slate-400">{errors ? `${errors} erro(s)` : warnings ? `${warnings} alerta(s)` : 'Sem alertas'} · última consulta {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(health.checkedAt))}</span></div>}
    </section>
    {error && <div role="alert" className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-5 text-sm text-rose-100">{error}</div>}
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {(health?.services || (loading ? Array.from({ length: 5 }, (_, index): Service => ({ id: String(index), label: 'Consultando serviço...', status: 'healthy', message: 'Aguarde a verificação segura.' })) : [])).map(service => {
        const state = visual[service.status]; const Icon = state.icon;
        return <article key={service.id} className={`rounded-2xl border p-5 ${state.card}`}><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950/70"><Icon className="h-5 w-5 text-white" /></span><div><h2 className="font-bold text-white">{service.label}</h2><span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${state.badge}`}>{state.title}</span></div></div></div><p className="mt-5 min-h-10 text-sm leading-5 text-slate-300">{service.message}</p>{service.href && <Link href={service.href} className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-bold text-cyan-300 hover:text-cyan-200"><Wrench className="h-4 w-4" />Abrir área responsável</Link>}</article>;
      })}
    </section>
  </div>;
}
