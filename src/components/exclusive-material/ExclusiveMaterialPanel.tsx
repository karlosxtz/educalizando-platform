'use client';

import { EXCLUSIVE_MATERIAL_STATUS_LABEL } from '@/lib/exclusive-material';
import { supabase } from '@/lib/supabase';
import { CalendarDays,Check,ChevronRight,CircleUserRound,FileText,FileUp,Link2,Loader2,MessageCircle,PackageCheck,Search,Send,Trash2,WalletCards } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { FormEvent,useEffect,useMemo,useState } from 'react';

type Item = any;

const formatDate = (value?: string | null) => {
  if (!value) return 'Não informado';
  const date = new Date(value.includes('T') ? value : `${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(date);
};
const formatMoney = (value?: number | string | null) => value === null || value === undefined || value === '' ? 'A combinar' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
const dateAfterDays = (value: string) => {
  const days = Number(value);
  if (!Number.isInteger(days) || days < 1) return 'Informe o prazo para calcular a data';
  const date = new Date();
  date.setDate(date.getDate() + days);
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(date);
};

function Detail({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3"><p className="flex items-center gap-1.5 text-xs font-bold text-slate-500">{icon}{label}</p><p className="mt-1.5 break-words text-sm font-black text-slate-800">{value}</p></div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-xs font-black uppercase tracking-wide text-violet-900">{label}<span className="mt-1.5 block">{children}</span></label>;
}
function deliveryDate(createdAt: string, days: number) {
  const date = new Date(createdAt);
  date.setDate(date.getDate() + Number(days || 0));
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(date);
}
function deliveryCountdown(proposal: Item, paidAt: string) {
  const start = new Date(paidAt);
  const due = new Date(start);
  due.setDate(due.getDate() + Number(proposal.delivery_days || 0));
  const remainingMs = due.getTime() - Date.now();
  const remaining = Math.ceil(remainingMs / 86400000);
  const total = Math.max(1, Number(proposal.delivery_days || 1));
  const elapsed = Math.max(0, total - Math.max(0, remaining));
  const absoluteMs = Math.abs(remainingMs);
  const days = Math.floor(absoluteMs / 86400000);
  const hours = Math.floor((absoluteMs % 86400000) / 3600000);
  const label = remainingMs < 0 ? `${days}d ${hours}h em atraso` : remainingMs <= 0 ? 'Prazo encerrado' : `${days}d ${hours}h restantes`;
  return { due, remaining, label, progress: Math.min(100, Math.round((elapsed / total) * 100)) };
}
function ConversationMessage({ message, view }: { message: Item; view: 'creator' | 'customer' }) {
  const isOwn = message.sender_role === view;
  const isProposal = /^(Proposta enviada|Contraproposta)/.test(message.body || '');
  const author = message.author_name || (message.sender_role === 'creator' ? 'Criador Educalizando' : message.sender_role === 'customer' ? 'Cliente Educalizando' : 'Educalizando');
  const avatar = message.author_avatar_url || null;
  const time = message.created_at ? new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(message.created_at)) : '';
  const avatarElement = message.sender_role !== 'system' ? avatar ? <img src={avatar} alt={`Foto de ${author}`} className="h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-white"/> : <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-200 text-[11px] font-black text-slate-600">{author.charAt(0).toUpperCase()}</span> : null;
  return <div className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>{!isOwn && avatarElement}<div className={`max-w-[82%] rounded-2xl border px-4 py-3 text-sm shadow-sm ${message.sender_role === 'system' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : isProposal ? 'border-violet-200 bg-violet-50 text-violet-950' : isOwn ? 'border-blue-200 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-700'}`}><div className="flex items-center justify-between gap-6"><strong className="text-xs">{isProposal ? `${author} · negociação` : author}</strong>{time && <span className={`text-[10px] ${isOwn && !isProposal ? 'text-blue-100' : 'text-slate-400'}`}>{time}</span>}</div><p className="mt-1.5 whitespace-pre-wrap leading-6">{message.body}</p></div>{isOwn && avatarElement}</div>;
}
function AcceptedContract({ proposal }: { proposal: Item }) {
  return <div className="mt-5 overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50"><div className="border-b border-emerald-200 bg-emerald-600 px-4 py-3 text-white"><p className="text-xs font-black uppercase tracking-widest text-emerald-100">Proposta aceita · resumo do contrato</p><p className="mt-1 text-xl font-black">{formatMoney(proposal.amount)}</p></div><div className="grid gap-3 p-4 text-sm text-emerald-950 sm:grid-cols-3"><div><p className="text-xs font-bold text-emerald-700">Entrega prevista</p><p className="mt-1 font-black">{deliveryDate(proposal.created_at, proposal.delivery_days)}</p></div><div><p className="text-xs font-bold text-emerald-700">Prazo contratado</p><p className="mt-1 font-black">{proposal.delivery_days} {proposal.delivery_days === 1 ? 'dia' : 'dias'}</p></div><div><p className="text-xs font-bold text-emerald-700">Revisões incluídas</p><p className="mt-1 font-black">{proposal.revisions ?? 0}</p></div><div className="rounded-xl bg-white/80 p-3 sm:col-span-3"><p className="text-xs font-bold text-emerald-700">Entrega contratada</p><p className="mt-1 whitespace-pre-wrap leading-6">{proposal.scope}</p></div></div></div>;
}

export default function ExclusiveMaterialPanel({ view }: { view: 'creator' | 'customer' }) {
  const searchParams = useSearchParams();
  const requestedId = searchParams.get('pedido');
  const [items, setItems] = useState<Item[]>([]);
  const [active, setActive] = useState<Item | null>(null);
  const [messages, setMessages] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [proposalDays, setProposalDays] = useState('');
  const [counterProposalId, setCounterProposalId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);
  const [paying, setPaying] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedConversations, setExpandedConversations] = useState<Set<string>>(new Set());
  const notify = (message: string, tone: 'success' | 'error' = 'success') => {
    setNotice({ message, tone });
    window.setTimeout(() => setNotice(null), 4200);
  };
  const conversations = useMemo(() => {
    const grouped = new Map<string, { key: string; name: string; subtitle: string; avatar?: string | null; requests: Item[] }>();
    for (const item of items) {
      const key = view === 'creator' ? item.customer_id || item.customer_email : item.store?.id || item.store_id;
      const current = grouped.get(key);
      grouped.set(key, {
        key,
        name: view === 'creator' ? item.customer_name || 'Cliente Educalizando' : item.store?.nome_loja || 'Loja Educalizando',
        subtitle: view === 'creator' ? item.customer_email || 'Conta identificada' : 'Criador de conteúdo',
        avatar: view === 'creator' ? item.customer_avatar_url : item.store?.logo_url,
        requests: [...(current?.requests || []), item],
      });
    }
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return Array.from(grouped.values()).filter((conversation) => !term || conversation.name.toLocaleLowerCase('pt-BR').includes(term) || conversation.requests.some((item) => item.title.toLocaleLowerCase('pt-BR').includes(term)));
  }, [items, search, view]);
  const proposals = Array.isArray(active?.proposals) ? active.proposals : [];
  const payments = Array.isArray(active?.payments) ? active.payments : [];
  const acceptedProposal = proposals.find((item: Item) => item.id === active?.accepted_proposal_id) || null;
  const pendingProposal = proposals.find((item: Item) => item.status === 'sent') || null;
  const paidPayment = payments.find((item: Item) => item.status === 'paid' && item.paid_at) || null;
  const countdown = acceptedProposal && paidPayment ? deliveryCountdown(acceptedProposal, paidPayment.paid_at) : null;

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
    try {
      setActive(item);
      const response = await request(`/api/exclusive-material/${item.id}/messages`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Não foi possível abrir a conversa.');
      setMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch (caught) {
      setMessages([]);
      const message = caught instanceof Error ? caught.message : 'Não foi possível abrir a conversa.';
      setError(message);
      notify(message, 'error');
    }
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
    if (response.ok) { event.currentTarget.reset(); await open(active); await load(true); notify('Mensagem enviada para a conversa.'); }
    else notify('Não foi possível enviar a mensagem. Tente novamente.', 'error');
  };
  const proposal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!active) return;
    const form = new FormData(event.currentTarget);
    const response = await request(`/api/exclusive-material/${active.id}/proposals`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: Number(form.get('amount')), deliveryDays: Number(form.get('deliveryDays')), revisions: Number(form.get('revisions')), scope: form.get('scope') }) });
    if (response.ok) { await load(true); await open(active); notify('Proposta enviada ao cliente com sucesso.'); } else { const data = await response.json(); const message = data.error || 'Não foi possível enviar a proposta.'; setError(message); notify(message, 'error'); }
  };
  const accept = async (proposalId: string) => {
    if (!active) return;
    const response = await request(`/api/exclusive-material/${active.id}/proposals`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ proposalId, action: 'accept' }) });
    if (response.ok) { await load(true); notify('Proposta aceita. Você já pode seguir para o pagamento.'); }
    else notify('Não foi possível aceitar a proposta. Tente novamente.', 'error');
  };
  const cancelProposal = async (proposalId: string) => {
    if (!active) return;
    const response = await request(`/api/exclusive-material/${active.id}/proposals`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ proposalId }) });
    const data = await response.json().catch(() => ({}));
    if (response.ok) { await load(true); await open({ ...active, accepted_proposal_id: null }); notify(view === 'creator' ? 'Proposta cancelada. O cliente foi informado.' : 'Proposta cancelada com sucesso.'); }
    else notify(data.error || 'Não foi possível cancelar a proposta.', 'error');
  };
  const removeRequest = async () => {
    if (!active || !window.confirm('Deseja cancelar e remover esta solicitação do seu painel? O outro participante será avisado.')) return;
    const response = await request(`/api/exclusive-material?requestId=${encodeURIComponent(active.id)}`, { method: 'DELETE' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return notify(data.error || 'Não foi possível remover a solicitação.', 'error');
    setItems((current) => current.filter((item) => item.id !== active.id));
    setActive(null);
    setMessages([]);
    notify(data.cancelled ? 'Solicitação cancelada e removida. O outro participante foi avisado.' : 'Solicitação removida do seu painel.');
  };
  const counterProposal = async (event: FormEvent<HTMLFormElement>, proposalId: string) => {
    event.preventDefault();
    if (!active) return;
    const form = new FormData(event.currentTarget);
    const response = await request(`/api/exclusive-material/${active.id}/proposals`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposalId, action: 'counter', amount: Number(form.get('amount')), deliveryDays: Number(form.get('deliveryDays')), scope: String(form.get('scope') || '') }),
    });
    if (response.ok) {
      setCounterProposalId(null);
      await load(true);
      await open(active);
      notify('Contraproposta enviada ao criador.');
    } else {
      const data = await response.json();
      const message = data.error || 'Não foi possível enviar sua contraproposta.';
      setError(message);
      notify(message, 'error');
    }
  };
  const checkout = async () => {
    if (!active) return;
    setPaying(true);
    try {
      const response = await request(`/api/exclusive-material/${active.id}/checkout`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok || !data.checkoutUrl) {
        const message = data.error || 'Não foi possível iniciar o pagamento.';
        setError(message);
        notify(message, 'error');
        return;
      }
      notify('Pagamento criado. Abrindo a página segura de pagamento…');
      window.location.assign(data.checkoutUrl);
    } catch {
      notify('Não foi possível iniciar o pagamento. Tente novamente.', 'error');
    } finally { setPaying(false); }
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
    const uploadFile = form.get('uploadFile');
    const selectedFile = uploadFile instanceof File && uploadFile.size > 0 ? uploadFile : null;
    const deliveryLink = String(form.get('deliveryLink') || '').trim();
    try {
      if ((selectedFile ? 1 : 0) + (deliveryLink ? 1 : 0) !== 1) throw new Error('Escolha somente uma forma de entrega: um arquivo ou um link.');
      if (deliveryLink) {
        try { new URL(deliveryLink); } catch { throw new Error('Informe um link completo e válido para o material.'); }
      }
      const files: Array<{ url: string; name: string; contentType?: string; size?: number }> = selectedFile
        ? [{ url: await upload(selectedFile), name: selectedFile.name, contentType: selectedFile.type, size: selectedFile.size }]
        : [{ url: deliveryLink, name: 'Acessar material', contentType: 'text/uri-list' }];
      const coverFile = form.get('coverFile');
      const coverUrl = coverFile instanceof File && coverFile.size > 0 ? await upload(coverFile) : String(form.get('coverUrl') || '').trim() || null;
      const response = await request(`/api/exclusive-material/${active.id}/deliveries`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ files, coverUrl, title: form.get('title'), description: form.get('description'), educationYear: form.get('educationYear'), theme: form.get('theme'), tags: form.get('tags'), pages: Number(form.get('pages') || 0), fileFormat: form.get('fileFormat') }) });
      if (response.ok) { await load(true); await open(active); notify('Entrega enviada ao cliente com sucesso.'); } else { const data = await response.json(); const message = data.error || 'Não foi possível registrar a entrega.'; setError(message); notify(message, 'error'); }
    } catch (caught) { const message = caught instanceof Error ? caught.message : 'Não foi possível enviar os arquivos.'; setError(message); notify(message, 'error'); }
  };

  if (loading) return <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-blue-600" /></div>;
  if (error && !items.length) return <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-900"><h2 className="font-bold">Não foi possível carregar as solicitações</h2><p className="mt-2 text-sm">{error}</p><button type="button" onClick={() => { setError(''); void load(); }} className="mt-4 rounded-xl bg-rose-700 px-4 py-2 font-bold text-white">Tentar novamente</button></div>;

  return <><div className="grid min-h-[680px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[360px_minmax(0,1fr)]">
    <aside className="border-b border-slate-200 bg-white lg:border-b-0 lg:border-r">
      <div className="border-b border-slate-100 p-5"><p className="text-xs font-black uppercase tracking-widest text-blue-600">Central de mensagens</p><h2 className="mt-1 text-xl font-black text-slate-950">{view === 'creator' ? 'Seus clientes' : 'Seus criadores'}</h2><div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-100 px-3"><Search className="h-4 w-4 text-slate-400"/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar pessoa ou solicitação" className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none"/></div></div>
      <div className="max-h-[620px] overflow-y-auto p-3">
        {conversations.length === 0 && <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">Nenhuma conversa encontrada.</p>}
        {conversations.map((conversation) => { const expanded = expandedConversations.has(conversation.key); return <div key={conversation.key} className="mb-3 overflow-hidden rounded-2xl border border-slate-200 bg-white"><button type="button" onClick={() => setExpandedConversations((current) => { const next = new Set(current); if (next.has(conversation.key)) next.delete(conversation.key); else next.add(conversation.key); return next; })} className="flex w-full items-center gap-3 p-3 text-left hover:bg-slate-50" aria-expanded={expanded}>{conversation.avatar ? <img src={conversation.avatar} alt={`Foto de ${conversation.name}`} className="h-12 w-12 rounded-full object-cover ring-2 ring-blue-100"/> : <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-blue-100 to-violet-100 text-blue-700"><CircleUserRound className="h-6 w-6"/></span>}<span className="min-w-0 flex-1"><span className="block truncate text-sm font-black text-slate-950">{conversation.name}</span><span className="block truncate text-xs text-slate-500">{conversation.subtitle}</span></span><span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-black text-blue-700">{conversation.requests.length}</span><ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${expanded ? 'rotate-90' : ''}`}/></button>{expanded && <div className="border-t border-slate-100 p-1.5">{conversation.requests.map((item) => <button key={item.id} onClick={() => void open(item)} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left transition ${active?.id === item.id ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'hover:bg-slate-50'}`}><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{item.title}</span><span className={`mt-0.5 block truncate text-[11px] ${active?.id === item.id ? 'text-blue-100' : 'text-slate-500'}`}>{EXCLUSIVE_MATERIAL_STATUS_LABEL[item.status as keyof typeof EXCLUSIVE_MATERIAL_STATUS_LABEL] || item.status}</span></span><ChevronRight className="h-4 w-4 shrink-0"/></button>)}</div>}</div>; })}
      </div>
    </aside>
    <section className="min-h-96 bg-white p-5">
      {!active ? <div className="flex h-full min-h-72 items-center justify-center text-center text-sm text-slate-500">Selecione uma solicitação para visualizar o briefing, conversar, negociar e acompanhar a entrega.</div> : <>
        <div className="-mx-5 -mt-5 border-b border-slate-200 bg-white px-5 py-4"><div className="flex items-center gap-3">{(view === 'creator' ? active.customer_avatar_url : active.store?.logo_url) ? <img src={view === 'creator' ? active.customer_avatar_url : active.store.logo_url} alt="Foto do perfil" className="h-12 w-12 rounded-full object-cover ring-2 ring-blue-100"/> : <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-blue-100 to-violet-100 text-blue-700"><CircleUserRound className="h-6 w-6"/></span>}<div className="min-w-0 flex-1"><p className="truncate font-black text-slate-950">{view === 'creator' ? active.customer_name || 'Cliente Educalizando' : active.store?.nome_loja || 'Criador Educalizando'}</p><p className="truncate text-xs text-slate-500">{view === 'creator' ? active.customer_email || 'Conta verificada' : 'Conversa protegida pela plataforma'}</p></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{EXCLUSIVE_MATERIAL_STATUS_LABEL[active.status as keyof typeof EXCLUSIVE_MATERIAL_STATUS_LABEL] || active.status}</span></div></div>
        <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4"><p className="text-xs font-black uppercase tracking-widest text-blue-600">Solicitação selecionada</p><h2 className="mt-1 text-xl font-black text-slate-950">{active.title}</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{active.description}</p></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3"><Detail label="Quantidade" value={`${active.quantity || 1} ${active.quantity === 1 ? 'material' : 'materiais'}`} icon={<PackageCheck className="h-4 w-4" />} /><Detail label="Tema ou gênero" value={active.genre || 'Não informado'} icon={<FileText className="h-4 w-4" />} /><Detail label="Formato esperado" value={active.file_type || 'Não informado'} icon={<FileText className="h-4 w-4" />} /><Detail label="Público ou ano escolar" value={active.target_audience || 'Não informado'} icon={<MessageCircle className="h-4 w-4" />} /><Detail label="Prazo desejado" value={formatDate(active.deadline)} icon={<CalendarDays className="h-4 w-4" />} /><Detail label="Orçamento estimado" value={formatMoney(active.budget)} icon={<WalletCards className="h-4 w-4" />} /></div>
        {Array.isArray(active.reference_links) && active.reference_links.length > 0 && <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-4"><p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-700"><Link2 className="h-4 w-4" />Referências enviadas pelo cliente</p><div className="mt-2 space-y-1">{active.reference_links.map((link: string) => <a key={link} href={link} target="_blank" rel="noreferrer" className="block truncate text-sm font-semibold text-blue-700 underline">{link}</a>)}</div></div>}
        <div className="mt-5 border-t border-slate-100 pt-5"><div className="flex items-center justify-between gap-3"><div><h3 className="font-black text-slate-950">Conversa da solicitação</h3><p className="mt-1 text-xs text-slate-500">Mensagens e negociações ficam organizadas neste histórico.</p></div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">{active.status === 'delivered' ? 'Conversa encerrada' : 'Atualização automática'}</span></div><div className="mt-3 max-h-80 space-y-3 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50/80 p-4">{messages.length === 0 && <p className="p-3 text-sm text-slate-500">Ainda não há mensagens.</p>}{messages.map((message) => <ConversationMessage key={message.id} message={message} view={view} />)}</div>{['delivered', 'cancelled', 'rejected'].includes(active.status) ? <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800"><PackageCheck className="mr-2 inline h-4 w-4"/>{active.status === 'delivered' ? 'Solicitação fechada com sucesso. O material foi entregue e esta conversa foi encerrada.' : 'Esta solicitação foi encerrada e não aceita novas mensagens.'}</div> : <form onSubmit={postMessage} className="mt-3 flex items-end gap-2 rounded-2xl border border-slate-200 bg-white p-2"><textarea name="body" rows={2} placeholder={view === 'creator' ? 'Escreva uma mensagem para o cliente' : 'Escreva uma mensagem para o criador'} className="min-w-0 flex-1 resize-none border-0 px-2 py-2 text-sm outline-none"/><button aria-label="Enviar mensagem" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-600 text-white"><Send className="h-4 w-4"/></button></form>}</div>
        {view === 'creator' && acceptedProposal && active.status === 'awaiting_payment' && <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-xs font-black uppercase tracking-widest text-amber-700">Proposta aceita</p><h3 className="mt-1 text-lg font-black text-slate-950">Aguardando confirmação do pagamento</h3><p className="mt-1 text-sm text-slate-600">O prazo de produção ainda não começou. A contagem de dias e horas será iniciada automaticamente quando o pagamento for confirmado.</p><button type="button" onClick={() => void cancelProposal(acceptedProposal.id)} className="mt-4 rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-black text-rose-700">Cancelar proposta aceita</button></div>}
        {view === 'creator' && acceptedProposal && active.status !== 'delivered' && countdown && <div className="mt-5 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-violet-50 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-widest text-blue-700">Pagamento confirmado</p><h3 className="mt-1 text-lg font-black text-slate-950">Prazo de produção em andamento</h3><p className="mt-1 text-sm text-slate-600">A contagem começou no horário da confirmação do pagamento.</p></div><span className={`rounded-full px-3 py-1.5 text-xs font-black ${countdown.remaining < 0 ? 'bg-rose-100 text-rose-700' : 'bg-blue-600 text-white'}`}>{countdown.label}</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${countdown.progress}%` }}/></div><div className="mt-3 grid gap-2 text-sm sm:grid-cols-3"><p><span className="block text-xs font-bold text-slate-500">Entrega prevista</span><strong>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' }).format(countdown.due)}</strong></p><p><span className="block text-xs font-bold text-slate-500">Prazo contratado</span><strong>{acceptedProposal.delivery_days} dia(s)</strong></p><p><span className="block text-xs font-bold text-slate-500">Status</span><strong>Produção liberada</strong></p></div></div>}
        {view === 'creator' && pendingProposal && !active.accepted_proposal_id && <div className="mt-5 rounded-2xl border border-violet-200 bg-violet-50 p-4"><p className="text-xs font-black uppercase tracking-widest text-violet-700">Proposta enviada</p><h3 className="mt-1 font-black text-violet-950">Aguardando a resposta do cliente</h3><div className="mt-3 grid gap-2 text-sm sm:grid-cols-3"><p><span className="block text-xs font-bold text-violet-700">Valor</span><strong>{formatMoney(pendingProposal.amount)}</strong></p><p><span className="block text-xs font-bold text-violet-700">Data prevista</span><strong>{deliveryDate(pendingProposal.created_at, pendingProposal.delivery_days)}</strong></p><p><span className="block text-xs font-bold text-violet-700">Prazo</span><strong>{pendingProposal.delivery_days} dia(s)</strong></p></div><button type="button" onClick={() => void cancelProposal(pendingProposal.id)} className="mt-4 rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-black text-rose-700">Cancelar e excluir proposta</button></div>}
        {view === 'creator' && !pendingProposal && !active.accepted_proposal_id && ['open', 'negotiating'].includes(active.status) && <form onSubmit={proposal} className="mt-5 rounded-2xl border border-violet-200 bg-violet-50 p-4"><div><h3 className="font-black text-violet-950">Enviar proposta</h3><p className="mt-1 text-sm text-violet-800">Compare o pedido do cliente com a sua entrega antes de enviar a proposta.</p></div><div className="mt-4 grid gap-3 rounded-2xl border border-violet-100 bg-white/70 p-3 sm:grid-cols-2"><div><p className="text-xs font-black uppercase tracking-wide text-slate-500">O cliente pediu</p><p className="mt-1 text-sm font-bold text-slate-900">Entrega até: {formatDate(active.deadline)}</p><p className="mt-1 text-sm text-slate-700">Orçamento estimado: {formatMoney(active.budget)}</p><p className="mt-1 text-sm text-slate-700">{active.quantity || 1} {active.quantity === 1 ? 'material' : 'materiais'} · {active.file_type || 'formato não informado'}</p></div><div className="border-t border-violet-100 pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0"><p className="text-xs font-black uppercase tracking-wide text-violet-700">O que você consegue fazer</p><p className="mt-1 text-sm font-bold text-violet-950">Previsão de entrega: {dateAfterDays(proposalDays)}</p><p className="mt-1 text-sm text-violet-800">Informe abaixo valor, prazo, revisões e todos os itens da entrega.</p></div></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><Field label="Valor da proposta (R$)"><input name="amount" type="number" step="0.01" min="1" required placeholder="Ex.: 80,00" className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm" /></Field><Field label="Prazo de produção (dias)"><input name="deliveryDays" type="number" min="1" required value={proposalDays} onChange={(event) => setProposalDays(event.target.value)} placeholder="Ex.: 7" className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm" /></Field><Field label="Revisões incluídas"><input name="revisions" type="number" min="0" defaultValue="1" required className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm" /></Field></div><label className="mt-3 block text-xs font-black uppercase tracking-wide text-violet-900">O que está incluso na entrega<textarea name="scope" required rows={3} placeholder="Ex.: arquivo em PDF, capa personalizada, atividades, gabarito e 1 revisão." className="mt-1.5 w-full rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal" /></label><button className="mt-3 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-black text-white"><WalletCards className="h-4 w-4"/>Enviar proposta</button></form>}
        {view === 'customer' && active.accepted_proposal_id && active.proposals?.filter((item: Item) => item.id === active.accepted_proposal_id).map((item: Item) => <div key={item.id}><AcceptedContract proposal={item}/>{active.status === 'awaiting_payment' && <button type="button" onClick={() => void cancelProposal(item.id)} className="mt-3 w-full rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-black text-rose-700">Cancelar proposta aceita</button>}</div>)}
        {view === 'customer' && active.accepted_proposal_id && active.status === 'awaiting_payment' && <button disabled={paying} onClick={() => void checkout()} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-200 disabled:cursor-wait disabled:opacity-70">{paying ? <Loader2 className="h-4 w-4 animate-spin"/> : <Check className="h-4 w-4"/>}{paying ? 'Abrindo pagamento…' : `Pagar ${formatMoney(active.proposals?.find((item: Item) => item.id === active.accepted_proposal_id)?.amount)}`}</button>}
        {view === 'customer' && active.status === 'delivered' && active.deliveries?.length > 0 && <div className="mt-5 rounded-2xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-blue-50 p-5"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-200"><PackageCheck className="h-5 w-5"/></span><div><p className="text-xs font-black uppercase tracking-widest text-violet-700">Entrega concluída</p><h3 className="font-black text-slate-950">Seu material exclusivo está disponível</h3></div></div><p className="mt-3 text-sm leading-6 text-slate-600">A entrega foi concluída e ficou salva de forma privada na sua biblioteca.</p><a href={`/api/exclusive-material/${active.id}/deliveries/${active.deliveries[0].id}/download`} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 sm:w-auto"><FileText className="h-4 w-4"/>Acessar material<ChevronRight className="h-4 w-4"/></a></div>}
        {view === 'customer' && active.proposals?.filter((item: Item) => item.status === 'sent').map((item: Item) => <div key={item.id} className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><p className="font-black text-emerald-950">Proposta: {formatMoney(item.amount)}</p><div className="mt-3 grid gap-2 text-sm text-emerald-900 sm:grid-cols-3"><p><strong>Prazo:</strong> {item.delivery_days} {item.delivery_days === 1 ? 'dia' : 'dias'}</p><p><strong>Data de entrega:</strong> {deliveryDate(item.created_at, item.delivery_days)}</p><p><strong>Revisões:</strong> {item.revisions ?? 0}</p></div><div className="mt-3 rounded-xl bg-white/70 p-3 text-sm leading-6 text-emerald-950"><strong>O que será entregue</strong><p className="mt-1 whitespace-pre-wrap">{item.scope}</p></div><div className="mt-3 flex flex-wrap gap-2"><button onClick={() => void accept(item.id)} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white">Aceitar proposta</button><button type="button" onClick={() => setCounterProposalId(counterProposalId === item.id ? null : item.id)} className="rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-black text-emerald-800">Fazer contraproposta</button><button type="button" onClick={() => void cancelProposal(item.id)} className="rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-black text-rose-700">Excluir proposta</button></div>{counterProposalId === item.id && <form onSubmit={(event) => void counterProposal(event, item.id)} className="mt-4 rounded-xl border border-emerald-200 bg-white p-4"><p className="font-black text-emerald-950">Sua contraproposta</p><p className="mt-1 text-sm text-emerald-800">Ela será enviada ao criador com todos os detalhes e abrirá uma nova negociação.</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><Field label="Valor que você sugere (R$)"><input name="amount" type="number" step="0.01" min="1" required defaultValue={item.amount} className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm text-slate-900" /></Field><Field label="Prazo que você precisa (dias)"><input name="deliveryDays" type="number" min="1" required defaultValue={item.delivery_days} className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm text-slate-900" /></Field></div><label className="mt-3 block text-xs font-black uppercase tracking-wide text-emerald-900">Descrição e condições<textarea name="scope" required rows={3} defaultValue={item.scope} placeholder="Explique o que precisa mudar na entrega, no prazo ou no valor." className="mt-1.5 w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm font-normal normal-case tracking-normal text-slate-900" /></label><button className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white">Enviar contraproposta</button></form>}</div>)}
        {view === 'creator' && ['paid', 'in_production'].includes(active.status) && <form onSubmit={deliver} className="mt-5 overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-blue-50 shadow-sm"><div className="border-b border-emerald-100 p-5"><p className="text-xs font-black uppercase tracking-widest text-emerald-700">Pagamento confirmado</p><h3 className="mt-1 text-xl font-black text-emerald-950">Preparar entrega exclusiva</h3><p className="mt-1 text-sm leading-6 text-emerald-800">Preencha a apresentação, adicione uma capa e escolha uma única forma de acesso. O material ficará visível apenas para esta conta compradora.</p></div><div className="space-y-5 p-5"><section><p className="mb-3 text-sm font-black text-slate-900"><span className="mr-2 inline-grid h-6 w-6 place-items-center rounded-full bg-emerald-600 text-xs text-white">1</span>Apresentação do material</p><div className="grid gap-3 sm:grid-cols-2"><Field label="Título do material"><input name="title" required defaultValue={active.title} className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-900"/></Field><Field label="Ano ou etapa de ensino"><input name="educationYear" required defaultValue={active.target_audience || ''} placeholder="Ex.: 2º ano do Ensino Fundamental" className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-900"/></Field><Field label="Tema"><input name="theme" required defaultValue={active.genre || ''} placeholder="Ex.: Alfabetização" className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-900"/></Field><Field label="Formato do arquivo"><input name="fileFormat" required defaultValue={active.file_type || ''} placeholder="Ex.: PDF para imprimir" className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-900"/></Field><Field label="Quantidade de páginas"><input name="pages" type="number" min="0" placeholder="Ex.: 25" className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-900"/></Field><Field label="Tags"><input name="tags" placeholder="alfabetização, leitura, 2º ano" className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-900"/></Field></div><label className="mt-3 block text-xs font-black uppercase tracking-wide text-emerald-900">Descrição<textarea name="description" required rows={3} placeholder="Explique o conteúdo e como o cliente pode utilizar o material." className="mt-1.5 w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-slate-900"/></label></section><section className="border-t border-emerald-100 pt-5"><p className="mb-3 text-sm font-black text-slate-900"><span className="mr-2 inline-grid h-6 w-6 place-items-center rounded-full bg-emerald-600 text-xs text-white">2</span>Capa do material</p><div className="grid gap-3 sm:grid-cols-2"><Field label="Enviar imagem"><input name="coverFile" type="file" accept="image/*" className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-900"/></Field><Field label="Ou informar link da capa"><input name="coverUrl" type="url" placeholder="https://..." className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-900"/></Field></div></section><section className="border-t border-emerald-100 pt-5"><p className="text-sm font-black text-slate-900"><span className="mr-2 inline-grid h-6 w-6 place-items-center rounded-full bg-emerald-600 text-xs text-white">3</span>Acesso do cliente</p><p className="mt-1 text-xs leading-5 text-slate-500">Escolha somente uma opção: envie um arquivo final ou informe um link compartilhável.</p><div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch"><label className="rounded-2xl border border-emerald-200 bg-white p-4"><span className="flex items-center gap-2 text-sm font-black text-emerald-950"><FileUp className="h-4 w-4"/>Enviar arquivo</span><span className="mt-1 block text-xs text-slate-500">Um único arquivo final.</span><input name="uploadFile" type="file" className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"/></label><span className="grid place-items-center text-xs font-black text-slate-400">OU</span><label className="rounded-2xl border border-emerald-200 bg-white p-4"><span className="flex items-center gap-2 text-sm font-black text-emerald-950"><Link2 className="h-4 w-4"/>Usar link de acesso</span><span className="mt-1 block text-xs text-slate-500">Drive ou outra página compartilhável.</span><input name="deliveryLink" type="url" placeholder="https://..." className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"/></label></div></section><button className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-100 transition hover:bg-emerald-700 sm:w-auto"><PackageCheck className="h-4 w-4"/>Concluir e entregar material</button></div></form>}
        {['paid', 'in_production'].includes(active.status) && <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-sm font-black text-emerald-900">Pagamento confirmado: esta solicitação não pode mais ser cancelada.</p><p className="mt-1 text-xs leading-5 text-emerald-700">O pedido permanece protegido até a entrega. Qualquer encerramento financeiro precisa passar pelo processo de estorno.</p></div>}
        {!['paid', 'in_production'].includes(active.status) && <div className="mt-6 border-t border-slate-100 pt-4"><button type="button" onClick={() => void removeRequest()} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-black text-rose-700 hover:bg-rose-50"><Trash2 className="h-4 w-4"/>{active.status === 'delivered' ? 'Remover solicitação do painel' : 'Cancelar e excluir solicitação'}</button><p className="mt-2 text-xs text-slate-500">{active.status === 'delivered' ? 'A entrega continuará disponível em Meus Materiais; esta ação apenas arquiva a conversa finalizada.' : 'Ao cancelar, o outro participante receberá um aviso no histórico da conversa.'}</p></div>}
        {error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      </>}
    </section>
  </div>{notice && <div role="status" className={`fixed bottom-5 right-5 z-[100] max-w-sm rounded-2xl px-4 py-3 text-sm font-bold text-white shadow-xl ${notice.tone === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>{notice.message}</div>}</>;
}
