'use client';

import {
CREATOR_NETWORKING_PRESETS,
renderCreatorNetworkingMessage,
suggestedGreetingPresetId,
type CreatorNetworkingAudience,
} from '@/lib/creator-networking';
import { uploadToObjectStorage } from '@/lib/object-storage-client';
import {
CheckCircle2,
Clock3,
ImagePlus,
Loader2,
MessageCircle,
PackageOpen,
Palette,
Search,
Send,
Sparkles,
Trash2,
Users,
XCircle,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect,useMemo,useState } from 'react';
import { toast } from 'sonner';

type CreatorRecipient = {
  id: string;
  name: string;
  storeName: string;
  storeSlug: string;
  phoneLabel: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  productCount: number;
  hasLogo: boolean;
  hasBanner: boolean;
  storeReady: boolean;
  hasWhatsapp: boolean;
  groupInviteSent: boolean;
  groupInviteSentAt: string | null;
};

type SendResult = {
  requested: number;
  eligible: number;
  sent: number;
  failed: number;
  skipped: number;
  duplicates: number;
  alreadySent: number;
  textFallbacks: number;
  failures: Array<{ id: string; name: string; error: string }>;
  sentIds: string[];
};

const initialPreset = CREATOR_NETWORKING_PRESETS.find((preset) => preset.id === 'welcome')!;

export default function CreatorNetworkingPage() {
  const [creators, setCreators] = useState<CreatorRecipient[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState(initialPreset.message);
  const [activePreset, setActivePreset] = useState(initialPreset.id);
  const [audience, setAudience] = useState<CreatorNetworkingAudience>('all');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);

  const availableCreators = useMemo(() => creators.filter((creator) => creator.hasWhatsapp), [creators]);
  const audienceCreators = useMemo(() => creators.filter((creator) => {
    if (audience === 'low_products') return creator.productCount < 10;
    if (audience === 'incomplete_branding') return !creator.storeReady;
    return true;
  }), [audience, creators]);
  const selectableCreators = useMemo(
    () => audienceCreators.filter((creator) => creator.hasWhatsapp && (activePreset !== 'group' || !creator.groupInviteSent)),
    [activePreset, audienceCreators],
  );
  const filteredCreators = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('pt-BR');
    if (!term) return audienceCreators;
    return audienceCreators.filter((creator) => `${creator.name} ${creator.storeName} ${creator.phoneLabel}`.toLocaleLowerCase('pt-BR').includes(term));
  }, [audienceCreators, query]);
  const selectedCreators = useMemo(() => creators.filter((creator) => selectedIds.has(creator.id)), [creators, selectedIds]);
  const previewCreator = selectedCreators[0] || availableCreators[0];
  const allAvailableSelected = selectableCreators.length > 0 && selectableCreators.every((creator) => selectedIds.has(creator.id));
  const groupInvitesSent = creators.filter((creator) => creator.groupInviteSent).length;
  const lowProductCreators = creators.filter((creator) => creator.productCount < 10).length;
  const incompleteBrandingCreators = creators.filter((creator) => !creator.storeReady).length;

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
    const nextAudience: CreatorNetworkingAudience = preset.id === 'catalog' ? 'low_products' : preset.id === 'branding' ? 'incomplete_branding' : audience;
    setAudience(nextAudience);
    setSelectedIds(new Set(creators
      .filter((creator) => creator.hasWhatsapp
        && (nextAudience !== 'low_products' || creator.productCount < 10)
        && (nextAudience !== 'incomplete_branding' || !creator.storeReady)
        && (preset.id !== 'group' || !creator.groupInviteSent))
      .map((creator) => creator.id)));
    setResult(null);
  }

  function chooseAudience(nextAudience: CreatorNetworkingAudience, presetId?: 'catalog' | 'branding') {
    const nextPreset = presetId ? CREATOR_NETWORKING_PRESETS.find((item) => item.id === presetId) : null;
    setAudience(nextAudience);
    if (nextPreset) {
      setActivePreset(nextPreset.id);
      setMessage(nextPreset.message);
    }
    setSelectedIds(new Set(creators.filter((creator) => creator.hasWhatsapp
      && (nextAudience !== 'low_products' || creator.productCount < 10)
      && (nextAudience !== 'incomplete_branding' || !creator.storeReady))
      .map((creator) => creator.id)));
    setResult(null);
  }

  function applySuggestedGreeting() {
    applyPreset(suggestedGreetingPresetId(new Date().getHours()));
  }

  function toggleCreator(creator: CreatorRecipient) {
    if (!creator.hasWhatsapp || (activePreset === 'group' && creator.groupInviteSent)) return;
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(creator.id)) next.delete(creator.id);
      else next.add(creator.id);
      return next;
    });
    setResult(null);
  }

  function toggleAll() {
    setSelectedIds(allAvailableSelected ? new Set() : new Set(selectableCreators.map((creator) => creator.id)));
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
        body: JSON.stringify({ text: cleanMessage, imageUrl: imageUrl || null, creatorIds: Array.from(selectedIds), presetId: activePreset, audience }),
      });
      const payload = await response.json();
      if (payload.result) setResult(payload.result as SendResult);
      if (!response.ok) throw new Error(payload.error || payload.result?.failures?.[0]?.error || 'O envio não foi concluído.');
      if (payload.result.failed) toast.warning(`${payload.result.sent} enviada(s) e ${payload.result.failed} com falha.`);
      else if (payload.result.textFallbacks) toast.success(`${payload.result.sent} enviada(s). ${payload.result.textFallbacks} seguiram sem imagem para garantir a entrega.`);
      else toast.success(`${payload.result.sent} mensagem(ns) enviada(s) com sucesso.`);
      if (activePreset === 'group' && payload.result.sent > 0) {
        const sentAt = new Date().toISOString();
        const delivered = new Set<string>(payload.result.sentIds || []);
        setCreators((current) => current.map((creator) => delivered.has(creator.id)
          ? { ...creator, groupInviteSent: true, groupInviteSentAt: sentAt }
          : creator));
        setSelectedIds((current) => new Set(Array.from(current).filter((id) => !delivered.has(id))));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível concluir o envio.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-w-0 max-w-full space-y-6 overflow-x-hidden">
      <section className="overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950 via-slate-950 to-cyan-950 p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-300"><Users className="h-4 w-4" /> Networking de criadores</p>
            <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">Central de mensagens</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">Converse com sua rede de criadores usando mensagens personalizadas pela Evolution API. Selecione um modelo, revise o texto, anexe uma imagem e escolha quem receberá.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"><strong className="block text-2xl text-white">{creators.length}</strong><span className="text-[10px] uppercase tracking-wide text-slate-400">Criadores</span></div>
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3"><strong className="block text-2xl text-emerald-300">{availableCreators.length}</strong><span className="text-[10px] uppercase tracking-wide text-emerald-200">Disponíveis</span></div>
            <div className="rounded-2xl border border-blue-400/20 bg-blue-400/10 px-4 py-3"><strong className="block text-2xl text-blue-300">{selectedIds.size}</strong><span className="text-[10px] uppercase tracking-wide text-blue-200">Selecionados</span></div>
            <div className="rounded-2xl border border-violet-400/20 bg-violet-400/10 px-4 py-3"><strong className="block text-2xl text-violet-300">{groupInvitesSent}</strong><span className="text-[10px] uppercase tracking-wide text-violet-200">Já convidados</span></div>
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3"><strong className="block text-2xl text-amber-300">{lowProductCreators}</strong><span className="text-[10px] uppercase tracking-wide text-amber-200">Menos de 10 produtos</span></div>
            <div className="rounded-2xl border border-fuchsia-400/20 bg-fuchsia-400/10 px-4 py-3"><strong className="block text-2xl text-fuchsia-300">{incompleteBrandingCreators}</strong><span className="text-[10px] uppercase tracking-wide text-fuchsia-200">Visual incompleto</span></div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-blue-500/25 bg-slate-950 p-5 sm:p-6">
        <div><p className="text-xs font-black uppercase tracking-[0.16em] text-blue-300">Acompanhamento inteligente</p><h2 className="mt-1 text-xl font-black text-white">Ajude cada criador no ponto que limita sua loja</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Os públicos são atualizados pelos dados atuais da plataforma. Ao escolher uma ação, a mensagem adequada e todos os criadores elegíveis com WhatsApp são preparados automaticamente para revisão.</p></div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <button type="button" onClick={() => chooseAudience('low_products', 'catalog')} className={`rounded-2xl border p-5 text-left transition ${audience === 'low_products' ? 'border-amber-400 bg-amber-400/10 ring-1 ring-amber-400' : 'border-slate-800 bg-slate-900 hover:border-amber-500/50'}`}>
            <span className="flex items-center justify-between gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300"><PackageOpen className="h-5 w-5" /></span><strong className="text-2xl text-amber-300">{lowProductCreators}</strong></span>
            <strong className="mt-4 block text-base text-white">Lojas com menos de 10 produtos</strong><span className="mt-2 block text-xs leading-5 text-slate-400">Oriente o criador a fortalecer o catálogo para ampliar buscas, variedade e oportunidades de venda.</span><span className="mt-4 block text-xs font-black text-amber-300">Preparar mensagem e selecionar público →</span>
          </button>
          <button type="button" onClick={() => chooseAudience('incomplete_branding', 'branding')} className={`rounded-2xl border p-5 text-left transition ${audience === 'incomplete_branding' ? 'border-fuchsia-400 bg-fuchsia-400/10 ring-1 ring-fuchsia-400' : 'border-slate-800 bg-slate-900 hover:border-fuchsia-500/50'}`}>
            <span className="flex items-center justify-between gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-fuchsia-400/15 text-fuchsia-300"><Palette className="h-5 w-5" /></span><strong className="text-2xl text-fuchsia-300">{incompleteBrandingCreators}</strong></span>
            <strong className="mt-4 block text-base text-white">Lojas sem logo ou imagem de capa</strong><span className="mt-2 block text-xs leading-5 text-slate-400">Explique como uma vitrine completa transmite confiança, organização e aparência profissional.</span><span className="mt-4 block text-xs font-black text-fuchsia-300">Preparar mensagem e selecionar público →</span>
          </button>
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

      <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,.8fr)]">
        <article className="min-w-0 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-5 sm:p-6">
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
            {imageUrl && <div className="mt-4 flex min-w-0 max-w-full items-center gap-3 overflow-hidden rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3"><Image src={imageUrl} alt="Imagem anexada à mensagem" width={80} height={80} unoptimized className="h-20 w-20 shrink-0 rounded-lg object-cover" /><div className="min-w-0 flex-1 overflow-hidden"><p className="text-sm font-bold text-emerald-200">Imagem pronta para envio</p><p className="mt-1 block max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-xs text-slate-500" title={imageUrl}>Imagem armazenada com segurança</p></div><button type="button" onClick={() => setImageUrl('')} className="flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-lg text-rose-300 hover:bg-rose-500/10" aria-label="Remover imagem"><Trash2 className="h-4 w-4" /></button></div>}
          </div>
        </article>

        <article className="min-w-0 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-5 sm:p-6">
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
            <div><p className="text-xs font-black uppercase tracking-[0.16em] text-blue-300">3. Escolha os destinatários</p><h2 className="mt-1 text-xl font-black text-white">Criadores cadastrados</h2><p className="mt-1 text-xs text-slate-400">{activePreset === 'group' ? 'Quem já recebeu o convite fica identificado e não pode ser selecionado novamente.' : audience === 'low_products' ? 'Mostrando somente lojas com menos de 10 produtos.' : audience === 'incomplete_branding' ? 'Mostrando somente lojas sem logo ou sem imagem de capa.' : 'Criadores sem WhatsApp válido ficam visíveis, mas não podem ser selecionados.'}</p></div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="flex min-h-11 w-full items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 sm:min-w-64"><Search className="h-4 w-4 text-slate-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar criador ou loja" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none" /></label>
              <button type="button" onClick={toggleAll} disabled={!selectableCreators.length} className="min-h-11 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 text-xs font-black text-blue-200 hover:bg-blue-500/20 disabled:opacity-40">{allAvailableSelected ? 'Limpar seleção' : activePreset === 'group' ? 'Selecionar não convidados' : 'Selecionar todos'}</button>
            </div>
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto"><AudienceButton active={audience === 'all'} onClick={() => chooseAudience('all')} label={`Todos (${creators.length})`} /><AudienceButton active={audience === 'low_products'} onClick={() => chooseAudience('low_products', 'catalog')} label={`Menos de 10 produtos (${lowProductCreators})`} /><AudienceButton active={audience === 'incomplete_branding'} onClick={() => chooseAudience('incomplete_branding', 'branding')} label={`Visual incompleto (${incompleteBrandingCreators})`} /></div>
        </div>
        <div className="p-3 sm:p-4">
          {loading ? <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-400"><Loader2 className="h-5 w-5 animate-spin" />Carregando criadores…</div> : filteredCreators.length ? <div className="grid gap-2 lg:grid-cols-2">{filteredCreators.map((creator) => {
            const selected = selectedIds.has(creator.id);
            const inviteLocked = activePreset === 'group' && creator.groupInviteSent;
            return <button key={creator.id} type="button" disabled={!creator.hasWhatsapp || inviteLocked} onClick={() => toggleCreator(creator)} className={`flex min-h-20 items-center gap-3 rounded-2xl border p-3 text-left transition ${!creator.hasWhatsapp || inviteLocked ? 'cursor-not-allowed border-slate-800 bg-slate-900/40 opacity-60' : selected ? 'border-blue-400 bg-blue-500/10 ring-1 ring-blue-400' : 'border-slate-800 bg-slate-900 hover:border-slate-600'}`}>
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${selected ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-300'}`}>{selected ? <CheckCircle2 className="h-5 w-5" /> : <Users className="h-5 w-5" />}</span>
              <span className="min-w-0 flex-1"><strong className="block truncate text-sm text-white">{creator.name}</strong><span className="mt-0.5 block truncate text-xs text-slate-400">{creator.storeName}</span><span className="mt-1 flex flex-wrap gap-1.5"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${creator.productCount < 10 ? 'bg-amber-400/10 text-amber-300' : 'bg-emerald-400/10 text-emerald-300'}`}>{creator.productCount} produto(s)</span>{!creator.hasLogo && <span className="rounded-full bg-fuchsia-400/10 px-2 py-0.5 text-[10px] font-bold text-fuchsia-300">Sem logo</span>}{!creator.hasBanner && <span className="rounded-full bg-fuchsia-400/10 px-2 py-0.5 text-[10px] font-bold text-fuchsia-300">Sem capa</span>}</span><span className={`mt-1 block text-[11px] ${creator.hasWhatsapp ? 'text-emerald-300' : 'text-rose-300'}`}>{creator.phoneLabel}</span>{creator.groupInviteSent && <span className="mt-1 block text-[10px] font-black uppercase tracking-wide text-violet-300">Convite enviado{creator.groupInviteSentAt ? ` em ${new Intl.DateTimeFormat('pt-BR').format(new Date(creator.groupInviteSentAt))}` : ''}</span>}</span>
            </button>;
          })}</div> : <p className="p-12 text-center text-sm text-slate-500">Nenhum criador encontrado.</p>}
        </div>
        <div className="border-t border-slate-800 bg-slate-950 p-4 sm:flex sm:items-center sm:justify-between sm:gap-4 sm:p-5">
          <div className="mb-3 sm:mb-0">
            <p className="text-sm font-black text-white">{selectedIds.size} criador(es) selecionado(s)</p>
            <p className="mt-1 text-xs text-slate-400">{activePreset === 'group' ? 'Criadores já convidados são ignorados automaticamente.' : 'O envio usa a instância administrativa conectada na Evolution.'}</p>
          </div>
          <button type="button" onClick={() => void sendBroadcast()} disabled={sending || uploading || !selectedIds.size || !message.trim()} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-black text-white shadow-lg shadow-emerald-950/40 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-64">{sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}{sending ? 'Enviando para a rede…' : 'Enviar para selecionados'}</button>
        </div>
      </section>

      {result && <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-5 sm:p-6"><h2 className="text-lg font-black text-white">Resultado do último envio</h2><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6"><ResultCard label="Enviadas" value={result.sent} success /><ResultCard label="Falhas" value={result.failed} danger /><ResultCard label="Entregues sem imagem" value={result.textFallbacks} /><ResultCard label="Sem WhatsApp" value={result.skipped} /><ResultCard label="Já convidados" value={result.alreadySent} /><ResultCard label="Duplicados evitados" value={result.duplicates} /></div>{result.textFallbacks > 0 && <p className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-xs leading-5 text-amber-100">A imagem não foi aceita pela Evolution em {result.textFallbacks} envio(s), mas o texto foi entregue automaticamente para que o criador não ficasse sem a mensagem.</p>}{result.failures.length > 0 && <div className="mt-4 min-w-0 overflow-hidden rounded-xl border border-rose-500/20 bg-rose-500/5 p-4"><p className="text-xs font-black uppercase tracking-wide text-rose-300">Falhas para revisar</p><p className="mt-1 text-xs leading-relaxed text-slate-400">Os motivos abaixo já estão traduzidos. Corrija somente os números indicados ou tente reenviar após conferir a conexão da Evolution.</p><ul className="mt-3 min-w-0 space-y-2 text-xs text-rose-100">{result.failures.map((failure) => <li key={failure.id} className="min-w-0 break-all rounded-lg bg-slate-950/50 px-3 py-2 leading-relaxed"><strong className="text-white">{failure.name}:</strong> {failure.error}</li>)}</ul></div>}</section>}

    </div>
  );
}

function ResultCard({ label, value, success = false, danger = false }: { label: string; value: number; success?: boolean; danger?: boolean }) {
  const color = success ? 'text-emerald-300' : danger ? 'text-rose-300' : 'text-slate-200';
  return <div className="rounded-xl bg-slate-900 p-4"><span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</span><div className="mt-1 flex items-center gap-2">{danger && value > 0 ? <XCircle className="h-4 w-4 text-rose-400" /> : success ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <MessageCircle className="h-4 w-4 text-slate-500" />}<strong className={`text-2xl ${color}`}>{value}</strong></div></div>;
}

function AudienceButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`min-h-10 shrink-0 rounded-full border px-4 text-xs font-black transition ${active ? 'border-blue-400 bg-blue-500/15 text-blue-200' : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500'}`}>{label}</button>;
}
