'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Gift, Link2, Share2, Users } from 'lucide-react';

type ReferralData = { code: string; referrals: Array<{ id: string; eligible_until: string; status: string }>; totalCommission: number };

export default function CreatorReferralsPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { fetch('/api/creator-referrals', { cache: 'no-store' }).then(async response => {
    const payload = await response.json(); if (!response.ok) throw new Error(payload.error); setData(payload);
  }).catch(() => setError('Não foi possível carregar suas indicações agora.')); }, []);
  const link = useMemo(() => data ? `${typeof window === 'undefined' ? '' : window.location.origin}/vender?ref=${data.code}` : '', [data]);
  const copy = async () => { await navigator.clipboard.writeText(link); setCopied(true); window.setTimeout(() => setCopied(false), 1800); };
  const shareWhatsApp = () => window.open(`https://wa.me/?text=${encodeURIComponent(`Crie sua loja grátis na Educalizando pelo meu link e comece a vender materiais: ${link}`)}`, '_blank', 'noopener,noreferrer');
  const money = (amount: number) => amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  return <div className="space-y-6">
    <section className="rounded-3xl bg-gradient-to-br from-violet-950 via-violet-800 to-purple-700 p-6 text-white shadow-xl sm:p-10">
      <span className="inline-flex items-center gap-2 rounded-full bg-lime-300 px-3 py-1 text-xs font-black text-slate-950"><Gift className="h-4 w-4" /> Programa de indicação</span>
      <h1 className="mt-5 text-3xl font-black sm:text-5xl">Indique e ganhe 3%</h1>
      <p className="mt-3 max-w-3xl text-base leading-7 text-violet-100">Indique criadoras sem limite e receba 3% de cada venda paga delas por 12 meses. A bonificação sai da taxa da plataforma: a criadora indicada mantém o valor dela.</p>
      <div className="mt-7 grid gap-3 md:grid-cols-3">{[['1', 'Compartilhe seu link', 'Envie para professoras que ainda não vendem na plataforma.'], ['2', 'Ela cria a loja', 'O vínculo nasce no cadastro usando o seu link.'], ['3', 'Você recebe 3%', 'Em cada venda paga, por 12 meses.']].map(([n, title, text]) => <div key={n} className="rounded-2xl bg-white/10 p-4"><span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-lime-300 font-black text-slate-950">{n}</span><h2 className="mt-3 font-black">{title}</h2><p className="mt-1 text-sm text-violet-100">{text}</p></div>)}</div>
    </section>
    {error ? <p className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p> : <>
      <section className="rounded-2xl border border-violet-200 bg-violet-50 p-5"><div className="flex items-center gap-2"><Link2 className="h-5 w-5 text-violet-700" /><h2 className="font-black text-slate-900">Seu link de indicação</h2></div><p className="mt-2 text-sm text-slate-600">Válido por 12 meses para cada criadora indicada. Você pode indicar quantas quiser.</p><div className="mt-4 flex flex-col gap-3 sm:flex-row"><code className="min-w-0 flex-1 truncate rounded-xl border bg-white px-4 py-3 text-sm">{data ? link : 'Gerando seu link...'}</code><button onClick={copy} disabled={!data} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border bg-white px-4 font-bold"><Copy className="h-4 w-4" />{copied ? 'Copiado!' : 'Copiar'}</button><button onClick={shareWhatsApp} disabled={!data} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-lime-400 px-4 font-black text-slate-950"><Share2 className="h-4 w-4" />WhatsApp</button></div></section>
      <section className="grid gap-4 sm:grid-cols-2"><div className="rounded-2xl border bg-white p-5"><Users className="h-5 w-5 text-violet-700" /><p className="mt-3 text-sm text-slate-500">Criadoras indicadas</p><p className="text-3xl font-black">{data?.referrals.length ?? '—'}</p></div><div className="rounded-2xl border bg-white p-5"><Gift className="h-5 w-5 text-violet-700" /><p className="mt-3 text-sm text-slate-500">Comissão gerada</p><p className="text-3xl font-black">{data ? money(data.totalCommission) : '—'}</p></div></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-black text-slate-900">Mais informações</h2><div className="mt-5 grid gap-5 md:grid-cols-3"><article><h3 className="font-black text-violet-800">Indicações sem limite</h3><p className="mt-2 text-sm leading-6 text-slate-600">Seu link pode ser enviado para quantas criadoras você quiser. Cada nova conta fica vinculada somente a quem compartilhou o link.</p></article><article><h3 className="font-black text-violet-800">Regra clara de comissão</h3><p className="mt-2 text-sm leading-6 text-slate-600">Você recebe 3% das vendas pagas feitas diretamente por quem indicou. Não existe comissão em cascata sobre indicadas de outras indicadas.</p></article><article><h3 className="font-black text-violet-800">Sua indicação não perde valor</h3><p className="mt-2 text-sm leading-6 text-slate-600">A Educalizando separa 3% da taxa de 13% da plataforma. A criadora indicada mantém o valor líquido da venda.</p></article></div><div className="mt-5 rounded-xl bg-violet-50 p-4 text-sm text-violet-950"><strong>Prazo:</strong> cada vínculo vale por 12 meses a partir do cadastro. Vendas reembolsadas também têm a bonificação estornada.</div></section>
    </>}
  </div>;
}
