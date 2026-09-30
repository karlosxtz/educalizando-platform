'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ImagePlus,
  Loader2,
  Megaphone,
  MessageSquareText,
  PackageSearch,
  Search,
  Send,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { uploadToObjectStorage } from '@/lib/object-storage-client';
import {
  CREATOR_WHATSAPP_CAMPAIGN_PRESETS,
  renderCreatorWhatsAppCampaignMessage,
  suggestedCreatorCampaignPresetId,
  type CreatorWhatsAppCampaignPresetId,
} from '@/lib/creator-whatsapp-campaigns';

type Customer = {
  id: string;
  name: string;
  email: string;
  phoneLabel: string;
  hasWhatsapp: boolean;
  purchases: number;
  spent: number;
  lastPurchaseAt: string | null;
};

type Product = { id: string; title: string; slug: string; price: number; coverUrl: string | null };
type CampaignData = {
  connected: boolean;
  store: { name: string; slug: string; acceptsExclusive: boolean };
  customers: Customer[];
  products: Product[];
  summary: { total: number; available: number; unavailable: number };
};
type SendResult = {
  requested: number;
  eligible: number;
  sent: number;
  failed: number;
  skipped: number;
  duplicates: number;
  failures: Array<{ id: string; name: string; error: string }>;
};

const read = async (response: Response) => response.json().catch(() => ({ error: 'Não foi possível concluir esta ação.' }));
const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function CreatorWhatsAppCampaignCenter({ connected }: { connected: boolean }) {
  const [data, setData] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(connected);
  const [error, setError] = useState('');
  const initialPresetId = suggestedCreatorCampaignPresetId(new Date().getHours());
  const initialMessage = CREATOR_WHATSAPP_CAMPAIGN_PRESETS.find((item) => item.id === initialPresetId)?.message || '';
  const [presetId, setPresetId] = useState<CreatorWhatsAppCampaignPresetId>(initialPresetId);
  const [text, setText] = useState(initialMessage);
  const [productId, setProductId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const preset = CREATOR_WHATSAPP_CAMPAIGN_PRESETS.find((item) => item.id === presetId)!;
  const selectedProduct = data?.products.find((product) => product.id === productId) || null;

  useEffect(() => {
    if (!connected) return;
    let alive = true;
    void (async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch('/api/creator/whatsapp-module/campaigns', { cache: 'no-store' });
        const payload = await read(response);
        if (!response.ok) throw new Error(payload.error);
        if (alive) setData(payload);
      } catch (caught) {
        if (alive) setError(caught instanceof Error ? caught.message : 'Não foi possível carregar a central.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [connected]);

  const choosePreset = (nextId: CreatorWhatsAppCampaignPresetId) => {
    const next = CREATOR_WHATSAPP_CAMPAIGN_PRESETS.find((item) => item.id === nextId);
    if (!next) return;
    setPresetId(nextId);
    setText(next.message);
    setResult(null);
    if (!next.requiresProduct) setProductId('');
    if (nextId !== 'product') setImageUrl('');
  };

  const chooseProduct = (nextProductId: string) => {
    setProductId(nextProductId);
    const nextProduct = data?.products.find((product) => product.id === nextProductId);
    setImageUrl(nextProduct?.coverUrl || '');
  };

  const filteredCustomers = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('pt-BR');
    if (!term) return data?.customers || [];
    return (data?.customers || []).filter((customer) =>
      [customer.name, customer.email, customer.phoneLabel].some((value) => value.toLocaleLowerCase('pt-BR').includes(term)),
    );
  }, [data?.customers, query]);
  const eligibleVisible = filteredCustomers.filter((customer) => customer.hasWhatsapp);
  const allVisibleSelected = eligibleVisible.length > 0 && eligibleVisible.every((customer) => selectedIds.includes(customer.id));

  const toggleVisible = () => {
    const visibleIds = eligibleVisible.map((customer) => customer.id);
    if (allVisibleSelected) setSelectedIds((current) => current.filter((id) => !visibleIds.includes(id)));
    else setSelectedIds((current) => [...new Set([...current, ...visibleIds])]);
  };

  const preview = data ? renderCreatorWhatsAppCampaignMessage(text || preset.message, {
    customerName: data.customers[0]?.name || 'Cliente',
    storeName: data.store.name,
    productName: selectedProduct?.title,
    productPrice: selectedProduct ? money(selectedProduct.price) : null,
    link: presetId === 'product' && selectedProduct
      ? `https://www.educalizando.com.br/loja/${data.store.slug}/produto/${selectedProduct.slug || selectedProduct.id}`
      : presetId === 'exclusive'
        ? `https://www.educalizando.com.br/solicitar-material-exclusivo/${data.store.slug}`
        : `https://www.educalizando.com.br/loja/${data.store.slug}`,
  }) : text;

  const uploadImage = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToObjectStorage('store-assets', file);
      setImageUrl(url);
      toast.success('Imagem anexada à campanha.');
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Não foi possível enviar a imagem.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const send = async () => {
    if (!selectedIds.length) return toast.error('Selecione pelo menos um cliente com WhatsApp.');
    if (!text.trim()) return toast.error('Escreva a mensagem que será enviada.');
    if (preset.requiresProduct && !productId) return toast.error('Selecione o produto que será divulgado.');
    if (preset.requiresExclusiveEnabled && !data?.store.acceptsExclusive) return toast.error('Ative as solicitações de materiais exclusivos no módulo correspondente.');
    setSending(true);
    setResult(null);
    try {
      const response = await fetch('/api/creator/whatsapp-module/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presetId, text, imageUrl, productId, customerIds: selectedIds }),
      });
      const payload = await read(response);
      if (payload.result) setResult(payload.result);
      if (!response.ok && !payload.result) throw new Error(payload.error);
      if (payload.result?.sent) toast.success(`${payload.result.sent} mensagem(ns) enviada(s) pelo WhatsApp da sua loja.`);
      if (payload.result?.failed) toast.error(`${payload.result.failed} envio(s) não foram concluídos. Veja os detalhes abaixo.`);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Não foi possível enviar as mensagens.');
    } finally {
      setSending(false);
    }
  };

  if (!connected) return <section className="rounded-3xl border border-dashed border-emerald-300 bg-white p-6 text-center shadow-sm sm:p-8">
    <MessageSquareText className="mx-auto h-10 w-10 text-emerald-600" />
    <h2 className="mt-3 text-xl font-black text-slate-950">Central de relacionamento</h2>
    <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">Conecte o número da sua loja para enviar promoções, divulgar materiais e conversar com seus clientes usando modelos profissionais.</p>
  </section>;

  if (loading) return <section className="flex min-h-52 items-center justify-center rounded-3xl border bg-white"><Loader2 className="h-7 w-7 animate-spin text-emerald-600" /><span className="ml-3 font-bold text-slate-600">Carregando clientes e materiais...</span></section>;
  if (error || !data) return <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm font-bold text-rose-800">{error || 'Não foi possível abrir a central de relacionamento.'}</section>;

  return <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
    <header className="border-b border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 p-6 text-white sm:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div><span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-black text-emerald-300"><Megaphone className="h-4 w-4" /> CAMPANHAS DA SUA LOJA</span><h2 className="mt-3 text-2xl font-black sm:text-3xl">Fale com quem já comprou de você</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Escolha um modelo, personalize e envie pela sua conexão. Nome, loja, produto, preço e link são preenchidos individualmente.</p></div>
        <div className="grid grid-cols-3 gap-2 text-center"><div className="rounded-2xl bg-white/10 px-4 py-3"><b className="block text-xl">{data.summary.total}</b><span className="text-[11px] text-slate-300">clientes</span></div><div className="rounded-2xl bg-emerald-400/15 px-4 py-3"><b className="block text-xl text-emerald-300">{data.summary.available}</b><span className="text-[11px] text-slate-300">com WhatsApp</span></div><div className="rounded-2xl bg-white/10 px-4 py-3"><b className="block text-xl">{selectedIds.length}</b><span className="text-[11px] text-slate-300">selecionados</span></div></div>
      </div>
    </header>

    <div className="grid xl:grid-cols-[1.08fr_.92fr]">
      <div className="space-y-6 border-b border-slate-200 p-5 sm:p-7 xl:border-b-0 xl:border-r">
        <div><div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-emerald-600" /><h3 className="font-black text-slate-950">1. Escolha a mensagem</h3></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{CREATOR_WHATSAPP_CAMPAIGN_PRESETS.map((item) => {
          const disabled = item.requiresExclusiveEnabled && !data.store.acceptsExclusive;
          return <button key={item.id} type="button" disabled={disabled} onClick={() => choosePreset(item.id)} className={`rounded-2xl border p-4 text-left transition ${presetId === item.id ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100' : 'border-slate-200 hover:border-emerald-300'} disabled:cursor-not-allowed disabled:opacity-45`}><span className="flex items-start justify-between gap-2"><b className="text-sm text-slate-950">{item.title}</b>{presetId === item.id && <Check className="h-4 w-4 text-emerald-600" />}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{item.description}</span></button>;
        })}</div>{!data.store.acceptsExclusive && <p className="mt-2 text-xs text-amber-700">O convite de material exclusivo será liberado quando essa opção estiver ativa em Materiais Exclusivos.</p>}</div>

        {preset.requiresProduct && <label className="block"><span className="text-xs font-black uppercase tracking-wide text-slate-600">Produto publicado</span><select value={productId} onChange={(event) => chooseProduct(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold outline-none focus:border-emerald-500"><option value="">Selecione um material</option>{data.products.map((product) => <option key={product.id} value={product.id}>{product.title} · {money(product.price)}</option>)}</select></label>}

        <label className="block"><span className="text-xs font-black uppercase tracking-wide text-slate-600">Mensagem</span><textarea value={text} onChange={(event) => setText(event.target.value.slice(0, 3000))} rows={9} className="mt-2 w-full resize-y rounded-2xl border border-slate-300 p-4 text-sm leading-6 outline-none focus:border-emerald-500" /><span className="mt-1 block text-xs text-slate-500">Use: {'{{nome}}'}, {'{{loja}}'}, {'{{produto}}'}, {'{{preco}}'} e {'{{link}}'}.</span></label>

        <div><span className="text-xs font-black uppercase tracking-wide text-slate-600">Imagem opcional</span><div className="mt-2 flex flex-wrap items-center gap-3"><input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(event) => void uploadImage(event.target.files?.[0])} /><button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-black text-slate-700 disabled:opacity-60"><ImagePlus className="h-4 w-4" />{uploading ? 'Enviando...' : imageUrl ? 'Trocar imagem' : 'Anexar imagem'}</button>{imageUrl && <button type="button" onClick={() => setImageUrl('')} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-rose-50 px-4 text-sm font-black text-rose-700"><X className="h-4 w-4" /> Remover</button>}</div></div>

        <div><span className="text-xs font-black uppercase tracking-wide text-slate-600">Prévia para o cliente</span><div className="mt-2 rounded-3xl bg-[#efeae2] p-4 sm:p-6">{imageUrl && <img src={imageUrl} alt="Imagem anexada à campanha" className="mb-0 ml-auto max-h-56 w-full max-w-sm rounded-t-2xl object-cover" />}<div className={`ml-auto max-w-sm whitespace-pre-wrap bg-[#d9fdd3] p-4 text-sm leading-6 text-slate-900 shadow-sm ${imageUrl ? 'rounded-b-2xl' : 'rounded-2xl'}`}>{preview}<span className="mt-1 block text-right text-[10px] text-slate-500">agora ✓✓</span></div></div></div>
      </div>

      <div className="flex min-h-[760px] flex-col p-5 sm:p-7">
        <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Users className="h-5 w-5 text-emerald-600" /><h3 className="font-black text-slate-950">2. Selecione os clientes</h3></div><button type="button" onClick={toggleVisible} className="text-xs font-black text-emerald-700 hover:text-emerald-800">{allVisibleSelected ? 'Desmarcar visíveis' : 'Selecionar visíveis'}</button></div>
        <div className="relative mt-3"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome, e-mail ou WhatsApp" className="min-h-12 w-full rounded-xl border border-slate-300 pl-10 pr-3 text-sm outline-none focus:border-emerald-500" /></div>
        <div className="mt-3 max-h-[560px] flex-1 space-y-2 overflow-y-auto pr-1">{filteredCustomers.length ? filteredCustomers.map((customer) => {
          const selected = selectedIds.includes(customer.id);
          return <button type="button" key={customer.id} disabled={!customer.hasWhatsapp} onClick={() => setSelectedIds((current) => selected ? current.filter((id) => id !== customer.id) : [...current, customer.id])} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${selected ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300'} disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-55`}><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${selected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{selected ? <Check className="h-5 w-5" /> : <span className="font-black">{customer.name.charAt(0).toUpperCase()}</span>}</span><span className="min-w-0 flex-1"><b className="block truncate text-sm text-slate-950">{customer.name}</b><span className="block truncate text-xs text-slate-500">{customer.phoneLabel} · {customer.purchases} compra(s)</span></span><span className="text-xs font-black text-slate-500">{money(customer.spent)}</span></button>;
        }) : <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-slate-500"><PackageSearch className="mx-auto mb-2 h-8 w-8" />Nenhum cliente encontrado.</div>}</div>

        {result && <div className={`mt-4 rounded-2xl border p-4 ${result.failed ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}><b className="text-sm text-slate-950">Resultado do envio</b><p className="mt-1 text-sm text-slate-700">{result.sent} enviada(s) · {result.failed} falha(s) · {result.skipped} sem WhatsApp</p>{result.failures.length > 0 && <div className="mt-2 max-h-28 overflow-y-auto text-xs text-rose-700">{result.failures.map((failure) => <p key={failure.id}><b>{failure.name}:</b> {failure.error}</p>)}</div>}</div>}

        <div className="mt-4 rounded-2xl bg-slate-950 p-4 text-white"><div className="flex items-center justify-between gap-3"><div><b className="block text-sm">{selectedIds.length} cliente(s) selecionado(s)</b><span className="text-xs text-slate-400">Envio pela instância conectada da {data.store.name}</span></div><button type="button" onClick={() => void send()} disabled={sending || !selectedIds.length} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{sending ? 'Enviando...' : 'Enviar agora'}</button></div></div>
      </div>
    </div>
  </section>;
}

