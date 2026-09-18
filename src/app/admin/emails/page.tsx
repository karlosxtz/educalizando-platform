'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Mail, RefreshCw, Send, ShieldCheck, XCircle } from 'lucide-react';
import { toast } from 'sonner';

type Status = { configured: boolean; from: string };
const items = [
  ['Boas-vindas: cliente', 'Enviado ao criar uma conta de compra.', 'Cadastro concluído'],
  ['Boas-vindas: criador', 'Enviado ao concluir o cadastro de uma loja.', 'Loja criada'],
  ['Pagamento aprovado', 'Confirmação enviada após o pagamento real.', 'Pagamento confirmado'],
  ['Entrega e acesso', 'Enviado quando os materiais são liberados.', 'Acesso liberado'],
  ['Nova venda', 'Alerta enviado ao criador da loja.', 'Venda confirmada'],
  ['Comissão de afiliado', 'Alerta enviado ao afiliado da venda.', 'Comissão gerada'],
];

export default function AdminEmailAutomationsPage() {
  const [status, setStatus] = useState<Status | null>(null); const [loading, setLoading] = useState(true); const [testing, setTesting] = useState(false);
  const load = async () => { setLoading(true); try { const response = await fetch('/api/email-automations', { cache: 'no-store' }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Não foi possível consultar a Resend.'); setStatus(data); } catch (error: any) { toast.error(error.message || 'Não foi possível carregar.'); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const test = async () => { setTesting(true); try { const response = await fetch('/api/email-automations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'test' }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'O teste não pôde ser enviado.'); toast.success('Teste enviado ao e-mail do Super Admin.'); } catch (error: any) { toast.error(error.message || 'O teste falhou.'); } finally { setTesting(false); } };
  return <div className="space-y-6"><section className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-950 to-slate-950 p-6"><div className="flex gap-3"><span className="h-fit rounded-xl bg-violet-500/20 p-3 text-violet-300"><Mail className="h-7 w-7" /></span><div><p className="text-xs font-black uppercase tracking-widest text-violet-300">Controle global da plataforma</p><h1 className="mt-1 text-3xl font-black text-white">Automações de E-mail</h1><p className="mt-2 max-w-2xl text-sm text-slate-300">A Resend é centralizada aqui. Os e-mails são enviados para clientes, criadores e afiliados conforme os eventos reais da Educalizando.</p></div></div></section><section className="rounded-2xl border border-slate-800 bg-slate-950 p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><span className={`h-fit rounded-xl p-3 ${status?.configured ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>{status?.configured ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}</span><div><h2 className="font-black text-white">{loading ? 'Verificando conexão...' : status?.configured ? 'Resend conectado' : 'Resend não configurado'}</h2><p className="text-sm text-slate-400">{status?.configured ? `Remetente: ${status.from}` : 'Configure RESEND_API_KEY e RESEND_FROM_EMAIL no Vercel.'}</p></div></div><div className="flex gap-2"><button onClick={() => void load()} className="min-h-11 rounded-xl border border-slate-700 px-3 text-slate-200"><RefreshCw className="h-4 w-4" /></button><button onClick={() => void test()} disabled={!status?.configured || testing} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-bold text-white disabled:opacity-50"><Send className="h-4 w-4" />{testing ? 'Enviando...' : 'Enviar teste'}</button></div></div></section><section className="grid gap-4 md:grid-cols-2">{items.map(([title, description, trigger]) => <article key={title} className="rounded-xl border border-slate-800 bg-slate-950 p-5"><div className="flex items-start justify-between"><span className="rounded-lg bg-violet-500/10 p-2 text-violet-300"><Mail className="h-5 w-5" /></span><span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black text-emerald-400">ATIVA</span></div><h2 className="mt-4 font-black text-white">{title}</h2><p className="mt-1 text-sm text-slate-400">{description}</p><p className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-500"><ShieldCheck className="h-4 w-4 text-emerald-400" />Gatilho: {trigger}</p></article>)}</section></div>;
}
