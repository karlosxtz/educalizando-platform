'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock3,
  ImagePlus,
  Loader2,
  MessageCircle,
  Search,
  Send,
  Sparkles,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  CREATOR_NETWORKING_PRESETS,
  renderCreatorNetworkingMessage,
  suggestedGreetingPresetId,
} from '@/lib/creator-networking';
import { uploadToObjectStorage } from '@/lib/object-storage-client';

type CreatorRecipient = {
  id: string;
  name: string;
  storeName: string;
  storeSlug: string;
  phoneLabel: string;
  logoUrl: string | null;
  hasWhatsapp: boolean;
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

const initialPreset = CREATOR_NETWORKING_PRESETS.find((preset) => preset.id === 'welcome')!;

export default function CreatorNetworkingPage() {
  const [creators, setCreators] = useState<CreatorRecipient[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState(initialPreset.message);
  const [activePreset, setActivePreset] = useState(initialPreset.id);
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);

  const availableCreators = useMemo(() => creators.filter((creator) => creator.hasWhatsapp), [creators]);
  const filteredCreators = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('pt-BR');
    if (!term) return creators;
    return creators.filter((creator) => `${creator.name} ${creator.storeName} ${creator.phoneLabel}`.toLocaleLowerCase('pt-BR').includes(term));
  }, [creators, query]);
  const selectedCreators = useMemo(() => creators.filter((creator) => selectedIds.has(creator.id)), [creators, selectedIds]);
  const previewCreator = selectedCreators[0] || availableCreators[0];
  const allAvailableSelected = availableCreators.length > 0 && availableCreators.every((creator) => selectedIds.has(creator.id));

  useEffect(() => {
    async function loadCreators() {
      try {
        const response = await fetch('/api/admin/whatsapp-networking', { cache: 'no-store' });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Não foi possível carregar os criadores.');
        const list = (payload.creators || []) as CreatorRecipient[];
        setCreators(list);
        setSelectedIds(new Set(list.filter((creator) => creator.hasWhatsapp).map((creator) => creator.id)));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Não foi possível carregar os criadores.');
      } finally {
        setLoading(false);
      }
    }
    void loadCreators();
  }, []);

  function applyPreset(presetId: typeof activePreset) {
    const preset = CREATOR_NETWORKING_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;
    setActivePreset(preset.id);
    setMessage(preset.message);
    setResult(null);
  }

  function applySuggestedGreeting() {
    applyPreset(suggestedGreetingPresetId(new Date().getHours()));
  }

  function toggleCreator(creator: CreatorRecipient) {
    if (!creator.hasWhatsapp) return;
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(creator.id)) next.delete(creator.id);
      else next.add(creator.id);
      return next;
    });
    setResult(null);
  }

  function toggleAll() {
    setSelectedIds(allAvailableSelected ? new Set() : new Set(availableCreators.map((creator) => creator.id)));
    setResult(null);
  }

  async function uploadImage(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Selecione um arquivo de imagem.');
    if (file.size > 15 * 1024 * 1024) return toast.error('A imagem deve ter no máximo 15 MB.');
    setUploading(true);
    try {
      const url = await uploadToObjectStorage('main-banners', file);
      setImageUrl(url);
      toast.success('Imagem anexada à mensagem.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível anexar a imagem.');
    } finally {
      setUploading(false);
    }
  }

  async function sendBroadcast() {
    const cleanMessage = message.trim();
    if (!cleanMessage) return toast.error('Escreva a mensagem antes de enviar.');
    if (!selectedIds.size) return toast.error('Selecione pelo menos um criador com WhatsApp.');
    const attachmentText = imageUrl ? ' com uma imagem anexada' : '';
    if (!window.confirm(`Enviar esta mensagem${attachmentText} para ${selectedIds.size} criador(es)?`)) return;

    setSending(true);
    setResult(null);
    try {
      const response = await fetch('/api/admin/whatsapp-networking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanMessage, imageUrl: imageUrl || null, creatorIds: Array.from(selectedIds) }),
      });
      const payload = await response.json();
      if (payload.result) setResult(payload.result as SendResult);
      if (!response.ok) throw new Error(payload.error || payload.result?.failures?.[0]?.error || 'O envio não foi concluído.');
      if (payload.result.failed) toast.warning(`${payload.result.sent} enviada(s) e ${payload.result.failed} com falha.`);
      else toast.success(`${payload.result.sent} mensagem(ns) enviada(s) com sucesso.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível concluir o envio.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950 via-slate-950 to-cyan-950 p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-300"><Users className="h-4 w-4" /> Networking de criadores</p>
            <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">Central de mensagens</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">Converse com sua rede de criadores usando mensagens personalizadas pela Evolution API. Selecione um modelo, revise o texto, anexe uma imagem e escolha quem receberá.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"><strong className="block text-2xl text-white">{creators.length}</strong><span className="text-[10px] uppercase tracking-wide text-slate-400">Criadores</span></div>
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3"><strong className="block text-2xl text-emerald-300">{availableCreators.length}</strong><span className="text-[10px] uppercase tracking-wide text-emerald-200">Disponíveis</span></div>
            <div className="rounded-2xl border border-blue-400/20 bg-blue-400/10 px-4 py-3"><strong className="block text-2xl text-blue-300">{selectedIds.size}</strong><span className="text-[10px] uppercase tracking-wide text-blue-200">Selecionados</span></div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">1. Escolha uma abordagem</p><h2 className="mt-1 text-xl font-black text-white">Mensagens pré-definidas</h2></div>
          <button type="button" onClick={applySuggestedGreeting} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 text-xs font-black text-amber-200 hover:bg-amber-400/20"><Clock3 className="h-4 w-4" /> Sugerir pelo horário</button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {CREATOR_NETWORKING_PRESETS.map((preset) => (
            <button key={preset.id} type="button" onClick={() => applyPreset(preset.id)} className={`min-h-28 rounded-2xl border p-4 text-left transition ${activePreset === preset.id ? 'border-emerald-400 bg-emerald-400/10 ring-1 ring-emerald-400' : 'border-slate-800 bg-slate-900 hover:border-slate-600'}`}>
              <span className={`text-sm font-black ${activePreset === preset.id ? 'text-emerald-300' : 'text-white'}`}>{preset.title}</span>
              <span className="mt-2 block text-xs leading-relaxed text-slate-400">{preset.description}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <article className="rounded-2xl border border-slate-800 bg-slate-950 p-5 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">2. Prepare o conteúdo</p>
          <h2 className="mt-1 text-xl font-black text-white">Texto e imagem</h2>
          <p className="mt-2 text-xs text-slate-400">Use <strong className="text-slate-200">{'{{nome}}'}</strong> e <strong className="text-slate-200">{'{{loja}}'}</strong> para personalizar cada envio.</p>
          <label className="mt-5 block text-xs font-bold text-slate-300">Mensagem<textarea value={message} onChange={(event) => { setMessage(event.target.value); setResult(null); }} rows={10} maxLength={2000} className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm leading-relaxed text-white outline-none focus:border-emerald-500" /></label>
          <div className="mt-4 rounded-2xl border border-dashed border-slate-700 bg-slate-900/70 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="text-sm font-black text-white">Imagem opcional</p><p className="mt-1 text-xs text-slate-400">A imagem e o texto chegam juntos na mesma mensagem. PNG, JPG ou WEBP, até 15 MB.</p></div>
              <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 text-xs font-black text-white hover:bg-cyan-500">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}{uploading ? 'Enviando imagem…' : 'Anexar imagem'}
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" disabled={uploading} onChange={(event) => { void uploadImage(event.target.files?.[0]); event.currentTarget.value = ''; }} />
              </label>
            </div>
            {imageUrl && <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3"><Image src={imageUrl} alt="Imagem anexada à mensagem" width={80} height={80} unoptimized className="h-20 w-20 rounded-lg object-cover" /><div className="min-w-0 flex-1"><p className="text-sm font-bold text-emerald-200">Imagem pronta para envio</p><p className="mt-1 truncate text-xs text-slate-500">{imageUrl}</p></div><button type="button" onClick={() => setImageUrl('')} className="flex min-h-10 min-w-10 items-center justify-center rounded-lg text-rose-300 hover:bg-rose-500/10" aria-label="Remover imagem"><Trash2 className="h-4 w-4" /></button></div>}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-950 p-5 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Prévia personalizada</p>
          <div className="mt-4 rounded-3xl bg-[#0b141a] p-4 shadow-inner">
            <div className="ml-auto max-w-[92%] rounded-2xl rounded-tr-sm bg-[#005c4b] p-3 text-sm leading-relaxed text-white shadow">
              {imageUrl && <Image src={imageUrl} alt="Prévia do anexo" width={500} height={280} unoptimized className="mb-3 max-h-56 w-full rounded-xl object-cover" />}
              <p className="whitespace-pre-wrap">{previewCreator ? renderCreatorNetworkingMessage(message, previewCreator) : message}</p>
              <p className="mt-2 text-right text-[10px] text-emerald-100/70">prévia ✓✓</p>
            </div>
          </div>
          <div className="mt-4 flex gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs leading-relaxed text-amber-100"><Sparkles className="h-4 w-4 shrink-0" /><p>Cada criador recebe seu próprio nome e o nome da loja. Números repetidos recebem apenas uma mensagem.</p></div>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950">
        <div className="border-b border-slate-800 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div><p className="text-xs font-black uppercase tracking-[0.16em] text-blue-300">3. Escolha os destinatários</p><h2 className="mt-1 text-xl font-black text-white">Criadores cadastrados</h2><p className="mt-1 text-xs text-slate-400">Criadores sem WhatsApp válido ficam visíveis, mas não podem ser selecionados.</p></div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="flex min-h-11 min-w-64 items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3"><Search className="h-4 w-4 text-slate-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar criador ou loja" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none" /></label>
              <button type="button" onClick={toggleAll} disabled={!availableCreators.length} className="min-h-11 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 text-xs font-black text-blue-200 hover:bg-blue-500/20 disabled:opacity-40">{allAvailableSelected ? 'Limpar seleção' : 'Selecionar todos'}</button>
            </div>
          </div>
        </div>
        <div className="max-h-[30rem] overflow-y-auto p-3 sm:p-4">
          {loading ? <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-400"><Loader2 className="h-5 w-5 animate-spin" />Carregando criadores…</div> : filteredCreators.length ? <div className="grid gap-2 lg:grid-cols-2">{filteredCreators.map((creator) => {
            const selected = selectedIds.has(creator.id);
            return <button key={creator.id} type="button" disabled={!creator.hasWhatsapp} onClick={() => toggleCreator(creator)} className={`flex min-h-20 items-center gap-3 rounded-2xl border p-3 text-left transition ${!creator.hasWhatsapp ? 'cursor-not-allowed border-slate-800 bg-slate-900/40 opacity-50' : selected ? 'border-blue-400 bg-blue-500/10 ring-1 ring-blue-400' : 'border-slate-800 bg-slate-900 hover:border-slate-600'}`}>
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${selected ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-300'}`}>{selected ? <CheckCircle2 className="h-5 w-5" /> : <Users className="h-5 w-5" />}</span>
              <span className="min-w-0 flex-1"><strong className="block truncate text-sm text-white">{creator.name}</strong><span className="mt-0.5 block truncate text-xs text-slate-400">{creator.storeName}</span><span className={`mt-1 block text-[11px] ${creator.hasWhatsapp ? 'text-emerald-300' : 'text-rose-300'}`}>{creator.phoneLabel}</span></span>
            </button>;
          })}</div> : <p className="p-12 text-center text-sm text-slate-500">Nenhum criador encontrado.</p>}
        </div>
      </section>

      {result && <section className="rounded-2xl border border-slate-800 bg-slate-950 p-5 sm:p-6"><h2 className="text-lg font-black text-white">Resultado do último envio</h2><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4"><ResultCard label="Enviadas" value={result.sent} success /><ResultCard label="Falhas" value={result.failed} danger /><ResultCard label="Sem WhatsApp" value={result.skipped} /><ResultCard label="Duplicados evitados" value={result.duplicates} /></div>{result.failures.length > 0 && <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4"><p className="text-xs font-black uppercase tracking-wide text-rose-300">Falhas para revisar</p><ul className="mt-2 space-y-1 text-xs text-rose-100">{result.failures.map((failure) => <li key={failure.id}>{failure.name}: {failure.error}</li>)}</ul></div>}</section>}

      <div className="sticky bottom-4 z-20 rounded-2xl border border-emerald-400/30 bg-slate-950/95 p-3 shadow-2xl backdrop-blur sm:flex sm:items-center sm:justify-between sm:p-4">
        <div className="mb-3 sm:mb-0"><p className="text-sm font-black text-white">{selectedIds.size} criador(es) selecionado(s)</p><p className="text-xs text-slate-400">O envio usa a instância administrativa conectada na Evolution.</p></div>
        <button type="button" onClick={() => void sendBroadcast()} disabled={sending || uploading || !selectedIds.size || !message.trim()} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-black text-white shadow-lg shadow-emerald-950/50 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">{sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}{sending ? 'Enviando para a rede…' : 'Enviar para selecionados'}</button>
      </div>
    </div>
  );
}

function ResultCard({ label, value, success = false, danger = false }: { label: string; value: number; success?: boolean; danger?: boolean }) {
  const color = success ? 'text-emerald-300' : danger ? 'text-rose-300' : 'text-slate-200';
  return <div className="rounded-xl bg-slate-900 p-4"><span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</span><div className="mt-1 flex items-center gap-2">{danger && value > 0 ? <XCircle className="h-4 w-4 text-rose-400" /> : success ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <MessageCircle className="h-4 w-4 text-slate-500" />}<strong className={`text-2xl ${color}`}>{value}</strong></div></div>;
}
