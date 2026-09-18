'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Mail, RefreshCw, Send, ShieldCheck, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

type Status = { configured: boolean; from: string; appUrl: string };
const automations = [
  ['Boas-vindas do cliente', 'Quando uma conta de cliente é criada.', 'Conta criada'],
  ['Boas-vindas do criador', 'Quando um criador conclui o cadastro da loja.', 'Loja criada'],
  ['Pagamento aprovado', 'Logo após a confirmação do pagamento.', 'Pagamento confirmado'],
  ['Entrega e acesso', 'Após a liberação dos materiais na conta do cliente.', 'Acesso liberado'],
  ['Nova venda para o criador', 'Quando a venda é confirmada pela plataforma.', 'Venda confirmada'],
  ['Comissão de afiliado', 'Quando uma venda indicada gera comissão.', 'Comissão gerada'],
];

export default function EmailAutomationsPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const getToken = async () => (await supabase.auth.getSession()).data.session?.access_token;
  const load = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Faça login novamente para consultar as automações.');
      const response = await fetch('/api/email-automations', { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível consultar o Resend.');
      setStatus(data);
    } catch (error: any) { toast.error(error.message || 'Não foi possível carregar.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const test = async () => {
    setTesting(true);
    try {
      const token = await getToken();
      const response = await fetch('/api/email-automations', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ action: 'test' }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'O teste não pôde ser enviado.');
      toast.success('E-mail de teste enviado para o seu e-mail de login.');
    } catch (error: any) { toast.error(error.message || 'O teste falhou.'); }
    finally { setTesting(false); }
  };
  return <div className="mx-auto max-w-5xl space-y-6">
    <section className="rounded-3xl bg-gradient-to-br from-indigo-700 via-violet-700 to-fuchsia-600 p-6 text-white sm:p-8"><div className="flex items-start gap-3"><span className="rounded-2xl bg-white/15 p-3"><Mail className="h-7 w-7" /></span><div><p className="text-xs font-black uppercase tracking-widest text-white/75">Automação transacional</p><h1 className="mt-1 text-3xl font-black">E-mails da sua loja</h1><p className="mt-2 max-w-2xl text-sm text-white/85">Mensagens automáticas de boas-vindas, confirmação de venda, pagamento e entrega. Os disparos acontecem somente em eventos reais.</p></div></div></section>
    <section className="rounded-3xl border bg-white p-5 shadow-sm"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className={`rounded-2xl p-3 ${status?.configured ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{status?.configured ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}</span><div><h2 className="font-black">{loading ? 'Verificando Resend...' : status?.configured ? 'Resend conectado' : 'Resend não configurado'}</h2><p className="text-sm text-slate-500">{status?.configured ? `Remetente: ${status.from}` : 'Adicione RESEND_API_KEY e RESEND_FROM_EMAIL nas variáveis do servidor.'}</p></div></div><div className="flex gap-2"><button onClick={() => void load()} className="inline-flex min-h-11 items-center justify-center rounded-xl border px-3 text-sm font-bold"><RefreshCw className="h-4 w-4" /></button><button onClick={() => void test()} disabled={!status?.configured || testing} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"><Send className="h-4 w-4" /> {testing ? 'Enviando...' : 'Enviar teste'}</button></div></div>{!loading && !status?.configured && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">A chave nunca é cadastrada aqui: mantenha-a apenas no Vercel/servidor. Depois de salvar as variáveis, clique em atualizar.</p>}</section>
    <section className="grid gap-4 md:grid-cols-2">{automations.map(([title, description, trigger]) => <article key={title} className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><span className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600"><Mail className="h-5 w-5" /></span><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">ATIVA</span></div><h2 className="mt-4 font-black text-slate-900">{title}</h2><p className="mt-1 text-sm text-slate-600">{description}</p><p className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-500"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Gatilho: {trigger}</p></article>)}</section>
  </div>;
}
