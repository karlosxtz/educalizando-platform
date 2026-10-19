'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUpRight, Check, CircleHelp, Copy, ExternalLink, Flame, Loader2, Search, Shuffle, Sparkles, Users, X } from 'lucide-react';
import CatalogImage from '@/components/ui/CatalogImage';
import { authenticatedFetch } from '@/lib/client-api';
import { readApiJson } from '@/lib/api-response';
import { getCurrentCreatorStore, updateStore } from '@/lib/store-service';
import { instagramCommunityCard, instagramCommunityHandle, instagramCommunityUrl, type InstagramCommunityCard, type InstagramCommunityProfile } from '@/lib/instagram-community';
import type { Store } from '@/lib/types';

const endpoint = '/api/creator/instagram-community';
function InstagramIcon({ className = '' }: { className?: string }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>;
}
async function getNetwork(suffix = '', signal?: AbortSignal) {
  const response = await authenticatedFetch(endpoint + suffix, { signal, cache: 'no-store' });
  const body = await readApiJson(response);
  if (!response.ok) throw new Error(body.error || 'Não foi possível carregar a rede. Tente novamente.');
  return body;
}
// Only two visible cards request statistics at once. No timers, polling or image proxy.
let activeProfiles = 0;
const profileQueue: (() => void)[] = [];
const profileResults = new Map<string, Promise<InstagramCommunityProfile | null>>();
function loadProfile(card: InstagramCommunityCard) {
  const key = card.id + ':' + card.handle;
  if (!profileResults.has(key)) profileResults.set(key, new Promise(resolve => {
    const run = () => {
      activeProfiles++;
      getNetwork('?profile=' + encodeURIComponent(card.id)).then(body => resolve(body.profile)).catch(() => resolve(null)).finally(() => { activeProfiles--; profileQueue.shift()?.(); });
    };
    if (activeProfiles < 2) run(); else profileQueue.push(run);
  }));
  return profileResults.get(key)!;
}
function ProfileCard({ card, own, statisticsEnabled }: { card: InstagramCommunityCard; own: boolean; statisticsEnabled: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const [profile, setProfile] = useState<InstagramCommunityProfile | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!statisticsEnabled) return;
    let alive = true;
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      void loadProfile(card).then(value => { if (alive) setProfile(value); });
    }, { rootMargin: '80px' });
    if (ref.current) observer.observe(ref.current);
    return () => { alive = false; observer.disconnect(); };
  }, [card, statisticsEnabled]);
  const copy = async () => {
    try { await navigator.clipboard.writeText(card.url); setCopied(true); } catch { setCopied(false); }
  };
  return <article ref={ref} className="group relative flex min-w-0 flex-col overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_5px_25px_-16px_#4c1d95] transition hover:-translate-y-1 hover:shadow-[0_15px_40px_-22px_#7c3aed] motion-reduce:transform-none">
    <div className="relative h-24 overflow-hidden bg-gradient-to-br from-violet-100 via-pink-100 to-orange-100">
      {card.banner && <CatalogImage src={card.banner} alt={`Capa da loja ${card.name}`} width={600} height={180} className="h-full w-full object-cover opacity-80" />}
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
      {own && <span className="absolute right-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold text-violet-800">Seu perfil</span>}
    </div>
    <div className="flex flex-1 flex-col px-5 pb-5">
      <div className="relative -mt-9 mb-4 flex items-end justify-between gap-2">
        <div className="rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-violet-600 p-[3px] shadow-sm"><div className="h-[76px] w-[76px] overflow-hidden rounded-full border-[3px] border-white bg-white">
          {profile?.photo || card.logo ? <CatalogImage key={profile?.photo || card.logo} src={profile?.photo || card.logo || undefined} thumbnail={!profile?.photo} alt={profile?.photo ? `Foto do Instagram @${card.handle}` : `Logo da loja ${card.name}`} width={76} height={76} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center bg-violet-50 text-2xl font-extrabold text-violet-700">{card.name.charAt(0).toUpperCase()}</div>}
        </div></div>
        <button onClick={() => void copy()} aria-label={`Copiar link do Instagram de ${card.name}`} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-violet-50 hover:text-violet-800">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</button>
      </div>
      <h2 className="text-lg font-extrabold leading-6 text-slate-950">{card.name}</h2>
      <a href={card.url} target="_blank" rel="noopener noreferrer" className="mt-1 truncate text-sm font-semibold text-fuchsia-700 hover:underline">@{card.handle}</a>
      <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">{card.description || 'Conheça os materiais e as ideias desta loja de educadores.'}</p>
      <div className="my-4 flex min-h-12 items-center gap-5 rounded-xl bg-slate-50 px-3 py-2">
        {profile?.followers !== null && profile?.followers !== undefined ? <div><p className="text-base font-extrabold text-slate-950">{profile.followers.toLocaleString('pt-BR')}</p><p className="text-[11px] text-slate-500">seguidores no Instagram</p></div> : <p className="text-xs leading-5 text-slate-500">Seguidores indisponíveis.<br />Conheça o perfil no Instagram.</p>}
        {profile?.mediaCount !== null && profile?.mediaCount !== undefined && <div className="ml-auto"><p className="text-base font-extrabold text-slate-950">{profile.mediaCount.toLocaleString('pt-BR')}</p><p className="text-[11px] text-slate-500">publicações</p></div>}
      </div>
      <a href={card.url} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-700 via-fuchsia-600 to-pink-600 px-4 text-sm font-bold text-white transition hover:brightness-110"><InstagramIcon className="h-5 w-5" />Visitar e seguir<ArrowUpRight className="h-4 w-4" /></a>
      <Link href={`/loja/${encodeURIComponent(card.slug)}`} className="mt-2 inline-flex min-h-10 items-center justify-center gap-1 text-xs font-semibold text-slate-600 hover:text-violet-700">Conhecer a loja<ArrowUpRight className="h-3.5 w-3.5" /></Link>
      {profile?.checkedAt && <p className="text-center text-[10px] text-slate-400">Dados da Meta · {new Date(profile.checkedAt).toLocaleDateString('pt-BR')}</p>}
    </div>
  </article>;
}

export default function InstagramCommunityPage() {
  const [cards, setCards] = useState<InstagramCommunityCard[]>([]);
  const [store, setStore] = useState<Store | null>(null);
  const [connection, setConnection] = useState<{ handle: string; expired: boolean } | null>(null);
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [limit, setLimit] = useState(12);
  const [rotation, setRotation] = useState(0);
  const [statisticsEnabled, setStatisticsEnabled] = useState(false);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [body, ownStore] = await Promise.all([getNetwork(), getCurrentCreatorStore()]);
      setCards(body.cards); setConnection(body.connection); setStatisticsEnabled(body.statisticsEnabled === true); setStore(ownStore); setInput(ownStore?.instagram || '');
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Não foi possível carregar a rede.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const filtered = useMemo(() => {
    const term = query.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const list = cards.filter(card => [card.name, card.handle, card.description].join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(term));
    if (list.length && rotation) { const offset = rotation % list.length; return [...list.slice(offset), ...list.slice(0, offset)]; }
    return list;
  }, [cards, query, rotation]);
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); if (!store) return;
    const handle = instagramCommunityHandle(input);
    if (input.trim() && !handle) { setError('Informe o @usuário ou o link de um perfil válido do Instagram.'); return; }
    setSaving(true); setError(''); setNotice('');
    try {
      const updated = await updateStore(store.id, { instagram: handle ? instagramCommunityUrl(handle) : null });
      setStore(updated); setInput(updated.instagram || '');
      const own = instagramCommunityCard(updated);
      setCards(current => [...(own ? [own] : []), ...current.filter(card => card.id !== store.id)]);
      setNotice(handle ? 'Perfil salvo! Sua loja já aparece na rede. A atualização para outros criadores pode levar até um minuto.' : 'Instagram removido da rede. Sua loja continua disponível.');
    } catch { setError('Não foi possível salvar o perfil. Tente novamente.'); }
    finally { setSaving(false); }
  };
  return <div className="mx-auto max-w-7xl space-y-6 pb-12">
    <header className="relative isolate overflow-hidden rounded-[30px] bg-[#211044] px-6 py-9 text-white sm:px-10 sm:py-12">
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 -z-10 h-96 w-96 rounded-full bg-fuchsia-600/40 blur-3xl" /><div aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-1/3 -z-10 h-64 w-64 rounded-full bg-orange-400/20 blur-3xl" />
      <div className="flex items-start justify-between gap-5"><div className="max-w-2xl"><p className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-pink-200"><Sparkles className="h-4 w-4" />Conexões que inspiram</p><h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">Criadores que se conectam.<br /><span className="text-pink-200">Ideias que vão mais longe.</span></h1><p className="mt-5 max-w-xl text-sm leading-7 text-violet-100 sm:text-base">Conheça quem cria, descubra novas ideias e leve a conversa para o Instagram. Sua próxima conexão começa aqui.</p></div><div aria-hidden="true" className="relative hidden h-24 w-24 shrink-0 items-center justify-center rounded-[28px] bg-gradient-to-br from-orange-400 via-pink-500 to-violet-600 shadow-xl shadow-pink-950/30 sm:flex"><InstagramIcon className="h-14 w-14" /><span className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full border-4 border-[#211044] bg-orange-400"><Flame className="h-5 w-5" /></span></div></div>
      <div className="mt-7 flex flex-wrap items-center gap-3"><span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold"><Users className="h-4 w-4" />{loading ? 'Conhecendo a comunidade…' : `${cards.length} ${cards.length === 1 ? 'perfil na comunidade' : 'perfis na comunidade'}`}</span><span className="text-xs text-violet-200">Descobertas renovadas todos os dias</span></div>
    </header>

    {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}{!store && <button onClick={() => void load()} className="min-h-10 font-bold underline">Tentar novamente</button>}</div>}
    {notice && <p role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</p>}
    <section className="rounded-[26px] border border-slate-200 bg-white p-5 sm:p-7" aria-labelledby="your-instagram">
      <div className="flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-pink-50 text-pink-600"><InstagramIcon className="h-6 w-6" /></div><div><h2 id="your-instagram" className="text-xl font-extrabold text-slate-950">Seu Instagram também faz parte</h2><p className="mt-1 text-sm leading-6 text-slate-500">O perfil cadastrado na sua loja aparece aqui automaticamente. Você pode atualizá-lo abaixo.</p></div></div>
      <form onSubmit={event => void save(event)} className="mt-5"><label htmlFor="community-handle" className="text-xs font-bold uppercase tracking-wide text-slate-600">Instagram da sua loja</label><div className="mt-2 flex flex-col gap-3 sm:flex-row"><input id="community-handle" value={input} onChange={event => setInput(event.target.value)} maxLength={250} autoComplete="off" placeholder="@sualoja ou https://www.instagram.com/sualoja/" disabled={loading || saving || !store} className="min-h-12 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" /><button disabled={loading || saving || !store} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-violet-700 px-6 text-sm font-bold text-white hover:bg-violet-800 disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{saving ? 'Salvando…' : 'Salvar perfil'}</button></div></form>
      {connection && <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600"><span>Conta {connection.expired ? 'com conexão expirada' : 'já autorizada'}: <strong>@{connection.handle}</strong></span><button onClick={() => setInput(instagramCommunityUrl(connection.handle))} className="min-h-9 rounded-lg bg-violet-50 px-3 font-bold text-violet-800">Usar esse perfil</button></div>}
      <p className="mt-3 text-xs leading-6 text-slate-500">Foto e seguidores do Instagram aparecem quando há conexão oficial válida e a Meta disponibiliza os dados. Nos outros perfis, mostramos a imagem da loja. O link sozinho não conecta sua conta.</p>
    </section>

    <section aria-labelledby="discover-creators" className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-fuchsia-700">Gente criativa, como você</p><h2 id="discover-creators" className="mt-1 text-2xl font-extrabold text-slate-950">Descubra outros criadores</h2></div><button onClick={() => { setRotation(current => current + Math.max(1, Math.floor(Math.random() * Math.max(1, cards.length)))); setLimit(12); }} disabled={!cards.length} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-violet-200 bg-white px-4 text-sm font-bold text-violet-800 hover:bg-violet-50 disabled:opacity-50"><Shuffle className="h-4 w-4" />Novas descobertas</button></div>
      <div className="relative"><Search aria-hidden="true" className="pointer-events-none absolute left-4 top-4 h-5 w-5 text-slate-400" /><label htmlFor="community-search" className="sr-only">Buscar por loja, perfil ou assunto</label><input id="community-search" value={query} onChange={event => { setQuery(event.target.value); setLimit(12); }} maxLength={100} placeholder="Encontre uma loja, um @ ou um assunto…" className="min-h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-12 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />{query && <button onClick={() => setQuery('')} aria-label="Limpar busca" className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>}</div>
      {loading ? <div role="status" className="flex items-center justify-center gap-3 rounded-2xl bg-white py-16 text-sm text-slate-500"><Loader2 className="h-5 w-5 animate-spin" />Carregando criadores…</div> : <><p role="status" className="text-xs text-slate-500">{filtered.length} {filtered.length === 1 ? 'perfil encontrado' : 'perfis encontrados'}</p><div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">{filtered.slice(0, limit).map(card => <ProfileCard key={card.id + ':' + card.handle} card={card} own={card.id === store?.id} statisticsEnabled={statisticsEnabled} />)}</div>{!filtered.length && <div className="rounded-[26px] border border-dashed border-violet-200 bg-violet-50/50 px-5 py-14 text-center"><Users className="mx-auto h-9 w-9 text-violet-400" /><h3 className="mt-4 text-lg font-bold text-slate-900">{query ? 'Nenhum perfil com essa busca' : 'As próximas conexões começam com você'}</h3><p className="mt-2 text-sm text-slate-500">{query ? 'Experimente o nome da loja ou outro assunto.' : 'Cadastre o Instagram da sua loja para participar da rede.'}</p></div>}{filtered.length > limit && <button onClick={() => setLimit(current => current + 12)} className="mx-auto flex min-h-12 items-center gap-2 rounded-xl border border-violet-200 bg-white px-6 text-sm font-bold text-violet-800 hover:bg-violet-50">Conhecer mais criadores<ArrowDown className="h-4 w-4" /></button>}</>}
    </section>
    <aside className="flex items-start gap-3 rounded-2xl border border-violet-100 bg-violet-50/60 p-5 text-sm leading-7 text-slate-600"><CircleHelp className="mt-1 h-5 w-5 shrink-0 text-violet-700" /><div><p><strong className="text-slate-900">Conexões de verdade, no seu ritmo.</strong> “Visitar e seguir” abre o Instagram; seguir fica por sua conta. A Educalizando não segue perfis automaticamente nem promete novos seguidores.</p><Link href="/dashboard/instagram" className="mt-2 inline-flex min-h-9 items-center gap-1 font-semibold text-violet-800 hover:underline">Ver situação da integração oficial<ExternalLink className="h-3.5 w-3.5" /></Link></div></aside>
  </div>;
}
