'use client';

import { FormEvent, useEffect, useState } from 'react';
import { CalendarDays, Check, CircleUserRound, FileText, FileUp, Link2, Loader2, MessageCircle, PackageCheck, Send, WalletCards } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { EXCLUSIVE_MATERIAL_STATUS_LABEL } from '@/lib/exclusive-material';
import { supabase } from '@/lib/supabase';

type Item = any;

const formatDate = (value?: string | null) => {
  if (!value) return 'Não informado';
  const date = new Date(value.includes('T') ? value : `${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(date);
};
const formatMoney = (value?: number | string | null) => value === null || value === undefined || value === '' ? 'A combinar' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));

function Detail({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3"><p className="flex items-center gap-1.5 text-xs font-bold text-slate-500">{icon}{label}</p><p className="mt-1.5 break-words text-sm font-black text-slate-800">{value}</p></div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-xs font-black uppercase tracking-wide text-violet-900">{label}<span className="mt-1.5 block">{children}</span></label>;
}

export default function ExclusiveMaterialPanel({ view }: { view: 'creator' | 'customer' }) {
  const searchParams = useSearchParams();
  const requestedId = searchParams.get('pedido');
  const [items, setItems] = useState<Item[]>([]);
  const [active, setActive] = useState<Item | null>(null);
  const [messages, setMessages] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const authHeaders = async (): Promise<Record<string, string>> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
  };
  const request = async (url: string, init: RequestInit = {}) => fetch(url, { ...init, credentials: 'include', headers: { ...(await authHeaders()), ...init.headers } });

  const load = async (silently = false) => {
    if (!silently) setLoading(true);
    try {
      const response = await request(`/api/exclusive-material?view=${view}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      const requests = data.requests || [];
      setItems(requests);
      if (active) setActive(requests.find((item: Item) => item.id === active.id) || null);
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível carregar.');
    } finally {
      if (!silently) setLoading(false);
    }
  };
  const open = async (item: Item) => {
    setActive(item);
    const response = await request(`/api/exclusive-material/${item.id}/messages`);
    const data = await response.json();
    setMessages(data.messages || []);
  };
  useEffect(() => {
    void load();
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load(true);
    }, 15000);
    return () => window.clearInterval(timer);
  }, [view, requestedId]);
  useEffect(() => {
    const selected = items.find((item) => item.id === requestedId);
    if (selected) void open(selected);
  }, [items, requestedId]);
  useEffect(() => {
    if (!active?.id) return;
    const refreshMessages = async () => {
      const response = await request(`/api/exclusive-material/${active.id}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    };
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refreshMessages();
    }, 8000);
    return () => window.clearInterval(timer);
  }, [active?.id]);

  const postMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!active) return;
    const form = new FormData(event.currentTarget);
    const body = String(form.get('body') || '');
    if (!body.trim()) return;
    const response = await request(`/api/exclusive-material/${active.id}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body }) });
    if (response.ok) { event.currentTarget.reset(); await open(active); await load(true); }
  };
  const proposal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!active) return;
    const form = new FormData(event.currentTarget);
    const response = await request(`/api/exclusive-material/${active.id}/proposals`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: Number(form.get('amount')), deliveryDays: Number(form.get('deliveryDays')), revisions: Number(form.get('revisions')), scope: form.get('scope') }) });
    if (response.ok) { await load(true); await open(active); } else { const data = await response.json(); setError(data.error || 'Não foi possível enviar a proposta.'); }
  };
  const accept = async (proposalId: string) => {
    if (!active) return;
    const response = await request(`/api/exclusive-material/${active.id}/proposals`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ proposalId, action: 'accept' }) });
    if (response.ok) await load(true);
  };
  const checkout = async () => {
    if (!active) return;
    const response = await request(`/api/exclusive-material/${active.id}/checkout`, { method: 'POST' });
    const data = await response.json();
    if (data.checkoutUrl) window.location.assign(data.checkoutUrl); else setError(data.error || 'Não foi possível abrir o checkout.');
  };
  const upload = async (file: File) => {
    const init = new FormData();
    init.append('action', 'init'); init.append('name', file.name); init.append('size', String(file.size)); init.append('contentType', file.type || 'application/octet-stream');
    const started = await request('/api/storage/upload-file', { method: 'POST', body: init });
    const meta = await started.json();
    if (!started.ok) throw new Error(meta.error || 'Falha no envio.');
    for (let offset = 0, index = 0; offset < file.size; offset += meta.chunkSize, index++) {
      const part = new FormData();
      part.append('action', 'chunk'); part.append('id', meta.id); part.append('index', String(index)); part.append('file', file.slice(offset, Math.min(file.size, offset + meta.chunkSize)), file.name);
      if (!(await request('/api/storage/upload-file', { method: 'POST', body: part })).ok) throw new Error('Não foi possível enviar o arquivo.');
    }
    const complete = new FormData();
    complete.append('action', 'complete'); complete.append('id', meta.id);
    const response = await request('/api/storage/upload-file', { method: 'POST', body: complete });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Não foi possível concluir o envio.');
    return data.value as string;
  };
  const deliver = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!active) return;
    const form = new FormData(event.currentTarget);
    const files: Array<{ url: string; name: string; contentType?: string; size?: number }> = String(form.get('files') || '').split('\n').map((url) => url.trim()).filter(Boolean).map((url) => ({ url, name: url.split('/').pop() || 'material exclusivo' }));
    const uploaded = Array.from(form.getAll('uploadFiles')).filter((value): value is File => value instanceof File && value.size > 0);
    try {
      for (const file of uploaded) files.push({ url: await upload(file), name: file.name, contentType: file.type, size: file.size });
      if (!files.length) throw new Error('Anexe um arquivo ou informe um link.');
      const response = await request(`/api/exclusive-material/${active.id}/deliveries`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ files, note: form.get('note') }) });
      if (response.ok) { await load(true); await open(active); } else { const data = await response.json(); setError(data.error || 'Não foi possível registrar a entrega.'); }
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Não foi possível enviar os arquivos.'); }
  };

  if (loading) return <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-blue-600" /></div>;
  if (error && !items.length) return <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-900"><h2 className="font-bold">Não foi possível carregar as solicitações</h2><p className="mt-2 text-sm">{error}</p><button type="button" onClick={() => { setError(''); void load(); }} className="mt-4 rounded-xl bg-rose-700 px-4 py-2 font-bold text-white">Tentar novamente</button></div>;

  return <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-black text-slate-950">{view === 'creator' ? 'Solicitações recebidas' : 'Minhas solicitações'}</h2>
      <div className="mt-4 space-y-2">
        {items.length === 0 && <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">Nenhuma solicitação ainda.</p>}
        {items.map((item) => <button key={item.id} onClick={() => void open(item)} className={`w-full rounded-2xl border p-4 text-left transition ${active?.id === item.id ? 'border-blue-400 bg-blue-50 shadow-sm' : 'border-slate-200 hover:bg-slate-50'}`}><p className="line-clamp-2 font-black text-slate-900">{item.title}</p><p className="mt-1 text-xs text-slate-500">{item.quantity} {item.quantity === 1 ? 'item' : 'itens'} · {EXCLUSIVE_MATERIAL_STATUS_LABEL[item.status as keyof typeof EXCLUSIVE_MATERIAL_STATUS_LABEL] || item.status}</p><p className="mt-2 text-xs font-bold text-blue-700">{view === 'creator' ? item.customer_name || 'Cliente Educalizando' : item.store?.nome_loja}</p></button>)}
      </div>
    </section>
    <section className="min-h-96 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      {!active ? <div className="flex h-full min-h-72 items-center justify-center text-center text-sm text-slate-500">Selecione uma solicitação para visualizar o briefing, conversar, negociar e acompanhar a entrega.</div> : <>
        <div className="border-b border-slate-100 pb-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-widest text-blue-600">Material exclusivo</p><h2 className="mt-1 text-xl font-black text-slate-950">{active.title}</h2></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{EXCLUSIVE_MATERIAL_STATUS_LABEL[active.status as keyof typeof EXCLUSIVE_MATERIAL_STATUS_LABEL] || active.status}</span></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{active.description}</p></div>
        {view === 'creator' && <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4"><p className="text-xs font-black uppercase tracking-widest text-slate-500">Quem solicitou</p><div className="mt-3 flex items-center gap-3">{active.customer_avatar_url ? <img src={active.customer_avatar_url} alt="Foto do cliente" className="h-11 w-11 rounded-full object-cover" /> : <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-slate-400"><CircleUserRound className="h-7 w-7" /></span>}<div className="min-w-0"><p className="truncate font-black text-slate-950">{active.customer_name || 'Cliente Educalizando'}</p><p className="truncate text-sm text-slate-500">{active.customer_email || 'E-mail não informado'}</p></div></div></div>}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3"><Detail label="Quantidade" value={`${active.quantity || 1} ${active.quantity === 1 ? 'material' : 'materiais'}`} icon={<PackageCheck className="h-4 w-4" />} /><Detail label="Tema ou gênero" value={active.genre || 'Não informado'} icon={<FileText className="h-4 w-4" />} /><Detail label="Formato esperado" value={active.file_type || 'Não informado'} icon={<FileText className="h-4 w-4" />} /><Detail label="Público ou ano escolar" value={active.target_audience || 'Não informado'} icon={<MessageCircle className="h-4 w-4" />} /><Detail label="Prazo desejado" value={formatDate(active.deadline)} icon={<CalendarDays className="h-4 w-4" />} /><Detail label="Orçamento estimado" value={formatMoney(active.budget)} icon={<WalletCards className="h-4 w-4" />} /></div>
        {Array.isArray(active.reference_links) && active.reference_links.length > 0 && <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-4"><p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-700"><Link2 className="h-4 w-4" />Referências enviadas pelo cliente</p><div className="mt-2 space-y-1">{active.reference_links.map((link: string) => <a key={link} href={link} target="_blank" rel="noreferrer" className="block truncate text-sm font-semibold text-blue-700 underline">{link}</a>)}</div></div>}
        <div className="mt-5 border-t border-slate-100 pt-5"><div className="flex items-center justify-between gap-3"><h3 className="font-black text-slate-950">Conversa da solicitação</h3><span className="text-xs text-slate-500">Mensagens ficam registradas aqui</span></div><div className="mt-3 max-h-52 space-y-2 overflow-y-auto rounded-2xl bg-slate-50 p-3">{messages.length === 0 && <p className="p-3 text-sm text-slate-500">Ainda não há mensagens. Envie uma mensagem para iniciar a conversa.</p>}{messages.map((message) => <div key={message.id} className={`rounded-xl p-3 text-sm ${message.sender_role === 'creator' ? 'bg-blue-100 text-blue-950' : message.sender_role === 'system' ? 'bg-emerald-50 text-emerald-800' : 'bg-white text-slate-700 shadow-sm'}`}><strong className="text-xs">{message.sender_role === 'creator' ? 'Criador' : message.sender_role === 'customer' ? 'Cliente' : 'Plataforma'}</strong><p className="mt-1 whitespace-pre-wrap">{message.body}</p></div>)}</div><form onSubmit={postMessage} className="mt-3 flex gap-2"><input name="body" placeholder="Escreva uma mensagem para o cliente" className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm"/><button aria-label="Enviar mensagem" className="rounded-xl bg-blue-600 px-3 text-white"><Send className="h-4 w-4"/></button></form></div>
        {view === 'creator' && !['delivered', 'cancelled', 'rejected'].includes(active.status) && <form onSubmit={proposal} className="mt-5 rounded-2xl border border-violet-200 bg-violet-50 p-4"><div><h3 className="font-black text-violet-950">Enviar proposta</h3><p className="mt-1 text-sm text-violet-800">O cliente receberá esta proposta na área dele e só seguirá para pagamento quando aceitá-la.</p></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><Field label="Valor da proposta (R$)"><input name="amount" type="number" step="0.01" min="1" required placeholder="Ex.: 80,00" className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm" /></Field><Field label="Prazo de produção (dias)"><input name="deliveryDays" type="number" min="1" required placeholder="Ex.: 7" className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm" /></Field><Field label="Revisões incluídas"><input name="revisions" type="number" min="0" defaultValue="1" required className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm" /></Field></div><label className="mt-3 block text-xs font-black uppercase tracking-wide text-violet-900">O que está incluso na entrega<textarea name="scope" required rows={3} placeholder="Ex.: arquivo em PDF, capa personalizada, atividades, gabarito e 1 revisão." className="mt-1.5 w-full rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal" /></label><button className="mt-3 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-black text-white"><WalletCards className="h-4 w-4"/>Enviar proposta</button></form>}
        {view === 'customer' && active.accepted_proposal_id && active.status === 'awaiting_payment' && <button onClick={() => void checkout()} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white"><Check className="h-4 w-4"/>Pagar proposta aceita</button>}
        {view === 'customer' && active.proposals?.filter((item: Item) => item.status === 'sent').map((item: Item) => <div key={item.id} className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><p className="font-black text-emerald-950">Proposta: {formatMoney(item.amount)}</p><div className="mt-3 grid gap-2 text-sm text-emerald-900 sm:grid-cols-2"><p><strong>Prazo de entrega:</strong> {item.delivery_days} {item.delivery_days === 1 ? 'dia' : 'dias'}</p><p><strong>Revisões incluídas:</strong> {item.revisions ?? 0}</p></div><div className="mt-3 rounded-xl bg-white/70 p-3 text-sm leading-6 text-emerald-950"><strong>O que será entregue</strong><p className="mt-1 whitespace-pre-wrap">{item.scope}</p></div><button onClick={() => void accept(item.id)} className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white">Aceitar proposta</button></div>)}
        {view === 'creator' && ['paid', 'in_production'].includes(active.status) && <form onSubmit={deliver} className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><h3 className="font-black text-emerald-950">Entregar arquivos</h3><textarea name="files" rows={3} placeholder="Cole um link por linha para cada arquivo enviado ao armazenamento" className="mt-3 w-full rounded-xl border px-3 py-2 text-sm"/><input name="uploadFiles" type="file" multiple className="mt-2 w-full rounded-xl border bg-white px-3 py-2 text-sm"/><input name="note" placeholder="Mensagem de entrega" className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"/><button className="mt-2 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white"><FileUp className="h-4 w-4"/>Confirmar entrega</button></form>}
        {error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      </>}
    </section>
  </div>;
}
