'use client';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Camera as Instagram, Download, Loader2, CheckCircle2, ShieldCheck, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { getCurrentCreatorStore, getProductsByStoreId } from '@/lib/store-service';
import type { Product, Store } from '@/lib/types';
import { INSTAGRAM_FORMATS, instagramProductCaption, type InstagramTarget, type InstagramPost, type InstagramSnapshot } from '@/lib/instagram-contract';
import { instagramFetch } from '@/lib/instagram-client';

const STATUS: Record<InstagramPost['status'], string> = { awaiting_upload: 'Aguardando a arte', creating: 'Preparando no Instagram', processing: 'Imagem em processamento', publishing: 'Enviando publicação', published: 'Publicado', failed: 'Não publicado', uncertain: 'Confirmação pendente — confira sua conta' };
function InstagramWorkspace() {
  const query = useSearchParams();
  const requestedProduct = query.get('produto'), requestedFormat = query.get('formato');
  const [store, setStore] = useState<Store | null>(null), [products, setProducts] = useState<Product[]>([]);
  const [snapshot, setSnapshot] = useState<InstagramSnapshot | null>(null), [productId, setProductId] = useState('');
  const [target, setTarget] = useState<InstagramTarget>('story'), [caption, setCaption] = useState('');
  const [art, setArt] = useState<Blob | null>(null), [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false), [generating, setGenerating] = useState(false), [review, setReview] = useState(false);
  const [loading, setLoading] = useState(true), [error, setError] = useState(''), [progress, setProgress] = useState('');
  const job = useRef<string | null>(null), alive = useRef(true), generation = useRef(0);
  const product = products.find(item => item.id === productId);
  const connected = !!snapshot?.account && !snapshot.account.expired;
  const ready = snapshot?.configured && !snapshot.migrationRequired && connected;
  useEffect(() => {
    alive.current = true;
    void (async () => {
      try {
        const current = await getCurrentCreatorStore();
        const [catalog, status] = await Promise.all([getProductsByStoreId(current.id), instagramFetch('/api/creator/instagram')]);
        if (!alive.current) return;
        const published = catalog.filter(item => ['publicado', 'ativo', 'published'].includes(item.status) && !item.excluido_em);
        setStore(current); setProducts(published); setSnapshot(status as InstagramSnapshot);
        setProductId(requestedProduct ? published.find(item => item.id === requestedProduct)?.id || '' : published[0]?.id || '');
        setTarget(requestedFormat === 'feed' ? 'feed' : 'story');
      } catch (cause) { if (alive.current) setError(cause instanceof Error ? cause.message : 'Não foi possível carregar a divulgação.'); }
      finally { if (alive.current) setLoading(false); }
    })();
    return () => { alive.current = false; generation.current++; };
  }, [requestedProduct, requestedFormat]);
  useEffect(() => {
    job.current = null; setArt(null); setReview(false); setGenerating(false); generation.current++;
    if (product && store) setCaption(instagramProductCaption(product, store));
  }, [product, store, target]);
  useEffect(() => {
    if (!art) { setPreview(''); return; }
    const url = URL.createObjectURL(art); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [art]);
  const refresh = async () => { const status = await instagramFetch('/api/creator/instagram'); if (alive.current) setSnapshot(status as InstagramSnapshot); };
  const generate = async () => {
    if (!product || !store) return;
    const revision = ++generation.current; setGenerating(true); setError(''); setArt(null); setReview(false); job.current = null;
    try {
      const { createInstagramArtwork } = await import('@/lib/instagram-artwork');
      const image = await createInstagramArtwork(product, store, target);
      if (image.size > 8000000) throw new Error('A arte ultrapassou 8 MB. Use uma capa menor e gere novamente.');
      if (alive.current && generation.current === revision) setArt(image);
    } catch (cause) { if (alive.current && generation.current === revision) setError(cause instanceof Error ? cause.message : 'Não foi possível criar a arte.'); }
    finally { if (alive.current && generation.current === revision) setGenerating(false); }
  };
  const connect = async () => {
    setBusy(true); setError('');
    try { const data = await instagramFetch('/api/creator/instagram', { method: 'POST', body: JSON.stringify({ action: 'connect' }) }); window.location.assign(data.authorizationUrl); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível abrir a conexão.'); setBusy(false); }
  };
  const disconnect = async () => {
    setBusy(true); setError('');
    try { await instagramFetch('/api/creator/instagram', { method: 'DELETE' }); await refresh(); setReview(false); toast.success('Instagram desconectado desta loja.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível desconectar.'); }
    finally { setBusy(false); }
  };
  const follow = async (id: string, allowPublish: boolean) => {
    for (let attempt = 0; attempt < 12 && alive.current; attempt++) {
      const data = await instagramFetch('/api/creator/instagram/posts' + (allowPublish ? '' : '?id=' + encodeURIComponent(id)), allowPublish ? { method: 'POST', body: JSON.stringify({ action: 'advance', id }) } : {});
      const post = data.post as InstagramPost; setProgress(STATUS[post.status]);
      if (post.status === 'published') { toast.success(post.target === 'story' ? 'Story publicado no Instagram.' : 'Publicação enviada ao feed.'); break; }
      if (post.status === 'failed' || post.status === 'uncertain') { setError(post.error_message || STATUS[post.status]); break; }
      if (!allowPublish) break;
      await new Promise(resolve => setTimeout(resolve, 2500));
    }
    if (alive.current) await refresh();
  };
  const publish = async () => {
    if (!art || !product || !store || !ready || busy) return;
    setBusy(true); setError(''); setProgress('Enviando a arte ao MinIO…'); setReview(false);
    try {
      job.current ||= crypto.randomUUID();
      const data = await instagramFetch('/api/creator/instagram/posts', { method: 'POST', body: JSON.stringify({ action: 'prepare', id: job.current, productId: product.id, expectedUpdatedAt: product.updated_at || null, target, caption, size: art.size }) });
      if (data.uploadUrl) {
        const response = await fetch(data.uploadUrl, { method: 'PUT', headers: data.uploadHeaders, body: art, signal: AbortSignal.timeout(90000) });
        if (!response.ok) throw new Error('O envio da arte ao MinIO não terminou. Confira sua conexão antes de retomar.');
      }
      await follow(job.current!, true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível confirmar a publicação. Consulte o histórico antes de repetir.'); await refresh().catch(() => {}); }
    finally { if (alive.current) { setBusy(false); setProgress(''); } }
  };
  const checkPost = async (post: InstagramPost) => {
    setBusy(true); setError('');
    try { await follow(post.id, post.status === 'processing'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível conferir a publicação.'); }
    finally { setBusy(false); setProgress(''); }
  };
  if (loading) return <div className="flex items-center gap-3 p-8 text-slate-600"><Loader2 className="h-5 w-5 animate-spin" />Carregando divulgação…</div>;
  return <div className="mx-auto max-w-6xl space-y-6 pb-12">
    <header className="rounded-3xl bg-gradient-to-br from-violet-950 via-fuchsia-800 to-rose-600 p-6 text-white sm:p-9">
      <p className="text-sm font-semibold text-fuchsia-100">Divulgação de {store?.nome_loja || 'sua loja'}</p>
      <h1 className="mt-3 flex items-center gap-3 text-3xl font-black"><Instagram className="h-8 w-8" />Sua loja no Instagram</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-fuchsia-50">Transforme a capa do seu material em uma arte para Story ou Feed. Confira a apresentação e publique na conta conectada à sua loja.</p>
      <Link href="/dashboard/produtos" className="mt-4 inline-block text-sm font-bold underline">Voltar para meus produtos</Link>
    </header>
    {query.get('conexao') && <p role="status" className="rounded-xl bg-blue-50 p-4 text-sm text-blue-900">{query.get('conexao') === 'conectada' ? 'Conta conectada. Confira o perfil abaixo antes de publicar.' : query.get('conexao') === 'cancelada' ? 'Conexão cancelada. Nenhuma publicação foi enviada.' : 'Não foi possível concluir a conexão. Abra uma nova autorização e tente novamente.'}</p>}
    {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="flex items-center gap-2 font-bold text-slate-900"><ShieldCheck className="h-5 w-5 text-emerald-600" />Conexão privada da sua loja</h2>
      {!snapshot?.configured || snapshot?.migrationRequired ? <p className="mt-3 text-sm leading-6 text-amber-900">A publicação direta ainda aguarda ativação pela Educalizando. Você já pode preparar e baixar as artes. O botão de conectar ficará disponível quando a integração oficial estiver pronta.</p> : <p className="mt-3 text-sm text-slate-600">{connected ? `Conectado a @${snapshot.account!.username}. A autorização vence em ${new Date(snapshot.account!.expires_at).toLocaleDateString('pt-BR')}.` : snapshot.account ? 'A autorização expirou. Conecte novamente para publicar.' : 'Conecte sua conta profissional. A autorização acontece no Instagram; não informe sua senha à Educalizando.'}</p>}
      <div className="mt-4 flex flex-wrap gap-3"><button disabled={busy || !snapshot?.configured || snapshot.migrationRequired} onClick={connect} className="min-h-11 rounded-xl bg-fuchsia-700 px-5 text-sm font-bold text-white disabled:opacity-40">{connected ? 'Reconectar Instagram' : 'Conectar Instagram'}</button>{snapshot?.account && <button disabled={busy} onClick={disconnect} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700">Desconectar desta loja</button>}</div>
      <p className="mt-3 text-xs leading-5 text-slate-500">Feed para contas profissionais. Nesta integração, Stories exigem conta do tipo Empresa. Desconectar interrompe novos envios; uma publicação já em andamento pode ser concluída pela Meta.</p>
    </section>
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-xl font-bold text-slate-900">1. Prepare sua divulgação</h2>
        <label className="block text-sm font-bold text-slate-700">Material publicado<select value={productId} disabled={busy || generating} onChange={event => setProductId(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3"><option value="">Selecione um material</option>{products.map(item => <option key={item.id} value={item.id}>{item.titulo}</option>)}</select></label>
        <fieldset disabled={busy || generating}><legend className="text-sm font-bold text-slate-700">Onde você quer publicar?</legend><div className="mt-2 grid grid-cols-2 gap-3">{(['story', 'feed'] as const).map(value => <label key={value} className={`flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border px-4 text-sm font-bold ${target === value ? 'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-900' : 'border-slate-200 text-slate-600'}`}><input type="radio" name="instagram-format" checked={target === value} onChange={() => setTarget(value)} />{INSTAGRAM_FORMATS[value].label}</label>)}</div></fieldset>
        <button onClick={generate} disabled={!product?.capa_url || busy || generating} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-violet-700 px-5 text-sm font-bold text-white disabled:opacity-40">{generating ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}{art ? 'Gerar arte novamente' : 'Gerar arte do material'}</button>
        <label className="block text-sm font-bold text-slate-700">{target === 'feed' ? 'Legenda do feed' : 'Texto de apoio para divulgação'}<textarea disabled={busy} maxLength={2200} value={caption} onChange={event => { setCaption(event.target.value); job.current = null; setReview(false); }} rows={8} className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal leading-6" /><span className="mt-1 block text-xs font-normal text-slate-500">{caption.length}/2200 caracteres. O texto inicial usa o cadastro do produto; revise antes de publicar.</span></label>
        <p className="text-xs leading-6 text-slate-500">O Instagram não transforma URLs na legenda em links clicáveis. A publicação automática de Story envia a imagem, sem sticker de link e sem este texto de apoio. Você pode usar o endereço da loja na bio do seu perfil.</p>
        <button disabled={!art || !ready || busy || (target === 'story' && snapshot?.account?.account_type !== 'BUSINESS')} onClick={() => setReview(true)} className="min-h-12 w-full rounded-xl bg-fuchsia-700 px-5 text-sm font-bold text-white disabled:opacity-40">Revisar publicação no Instagram</button>
        {review && <div className="space-y-3 rounded-2xl border border-fuchsia-200 bg-fuchsia-50 p-4"><h3 className="font-bold text-fuchsia-950">2. Confirme o envio</h3><p className="text-sm leading-6 text-fuchsia-900">A arte será enviada ao MinIO e publicada como <strong>{target === 'story' ? 'Story' : 'Feed'}</strong> em <strong>@{snapshot?.account?.username}</strong>. Confira a imagem ao lado antes de confirmar.</p><div className="flex flex-wrap gap-3"><button onClick={publish} disabled={busy} className="min-h-11 rounded-xl bg-fuchsia-800 px-4 font-bold text-white">Confirmar e publicar {target === 'story' ? 'Story' : 'no Feed'}</button><button onClick={() => setReview(false)} className="min-h-11 px-3 text-sm font-bold text-fuchsia-900">Voltar e revisar</button></div></div>}
        {busy && progress && <p role="status" className="flex items-center gap-2 text-sm text-violet-800"><Loader2 className="h-4 w-4 animate-spin" />{progress}</p>}
      </section>
      <aside className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-bold text-slate-900">Prévia da sua arte</h2>{preview ? <><img src={preview} width={INSTAGRAM_FORMATS[target].width} height={INSTAGRAM_FORMATS[target].height} alt={`Prévia da divulgação de ${product?.titulo}`} className="mx-auto mt-4 max-h-[580px] w-auto max-w-full rounded-xl object-contain" /><a href={preview} download={`educalizando-${target}-${product?.slug || product?.id || 'material'}.jpg`} className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-violet-800"><Download className="h-4 w-4" />Baixar arte JPEG</a></> : <div className="mt-4 flex aspect-[9/16] items-center justify-center rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">Selecione o material e gere a arte para conferir aqui.</div>}</aside>
    </div>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><h2 className="flex items-center gap-2 text-xl font-bold text-slate-900"><CheckCircle2 className="h-5 w-5 text-violet-700" />Últimas publicações</h2><p className="mt-2 text-sm text-slate-500">O resultado só aparece como publicado depois da confirmação da Meta. Se houver dúvida no envio, confira sua conta antes de criar outra publicação.</p><div className="mt-4 space-y-3">{snapshot?.posts.length ? snapshot.posts.map(post => <div key={post.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4"><div><p className="text-sm font-bold text-slate-800">{post.target === 'story' ? 'Story' : 'Feed'} · {STATUS[post.status]}</p><p className="mt-1 text-xs text-slate-500">{new Date(post.created_at).toLocaleString('pt-BR')}</p>{post.error_message && <p className="mt-2 max-w-xl text-xs leading-5 text-amber-900">{post.error_message}</p>}</div>{!['published', 'failed'].includes(post.status) && <button disabled={busy} onClick={() => checkPost(post)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-violet-800">{post.status === 'processing' ? 'Concluir publicação aprovada' : 'Consultar situação'}</button>}</div>) : <p className="text-sm text-slate-500">Suas publicações aparecerão aqui após a ativação e o primeiro envio.</p>}</div></section>
  </div>;
}
export default function InstagramPage() { return <Suspense fallback={<div className="p-8 text-slate-500">Carregando divulgação…</div>}><InstagramWorkspace /></Suspense>; }
