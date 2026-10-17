'use client';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getCurrentCreatorStore, getProductsByStoreId } from '@/lib/store-service';
import type { Product, Store } from '@/lib/types';
import { instagramProductCaption, type InstagramTarget, type InstagramPost, type InstagramSnapshot } from '@/lib/instagram-contract';
import { instagramFetch } from '@/lib/instagram-client';
import InstagramStudioView from '@/components/creator/InstagramStudioView';
import { defaultInstagramDesign, savedInstagramDesign, instagramBrandedCaption } from '@/lib/instagram-design';

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
  const [design, setDesign] = useState(defaultInstagramDesign()), [backgroundUrl, setBackgroundUrl] = useState(''), [logoUrl, setLogoUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
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
        try { setDesign(savedInstagramDesign(JSON.parse(localStorage.getItem(`instagram-design:${current.id}`) || 'null'), current.cor_primaria)); }
        catch { setDesign(defaultInstagramDesign(current.cor_primaria)); }
        setProductId(requestedProduct ? published.find(item => item.id === requestedProduct)?.id || '' : published[0]?.id || '');
        setTarget(requestedFormat === 'feed' ? 'feed' : 'story');
      } catch (cause) { if (alive.current) setError(cause instanceof Error ? cause.message : 'Não foi possível carregar a divulgação.'); }
      finally { if (alive.current) setLoading(false); }
    })();
    return () => { alive.current = false; generation.current++; };
  }, [requestedProduct, requestedFormat]);
  useEffect(() => {
    job.current = null; setArt(null); setReview(false); setGenerating(false); generation.current++;
    if (product && store) setCaption(instagramProductCaption(product, store, { showPrice: design.showPrice }));
  }, [product, store, target, design.showPrice]);
  useEffect(() => { setDesign(previous => ({ ...previous, title: '', subtitle: '' })); setImageUrl(''); }, [productId]);
  useEffect(() => {
    if (art) setPreview(URL.createObjectURL(art));
  }, [art]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => { setPreview(''); }, [productId, target]);
  const refresh = async () => { const status = await instagramFetch('/api/creator/instagram'); if (alive.current) setSnapshot(status as InstagramSnapshot); };
  const generate = useCallback(async () => {
    if (!product || !store) return;
    const revision = ++generation.current; setGenerating(true); setError(''); setArt(null); setReview(false); job.current = null;
    try {
      const { createInstagramArtwork } = await import('@/lib/instagram-artwork');
      const image = await createInstagramArtwork(product, store, target, { ...design, backgroundUrl, logoUrl, imageUrl });
      if (image.size > 8000000) throw new Error('A arte ultrapassou 8 MB. Use uma capa menor e gere novamente.');
      if (alive.current && generation.current === revision) setArt(image);
    } catch (cause) { if (alive.current && generation.current === revision) setError(cause instanceof Error ? cause.message : 'Não foi possível criar a arte.'); }
    finally { if (alive.current && generation.current === revision) setGenerating(false); }
  }, [product, store, target, design, backgroundUrl, logoUrl, imageUrl]);
  useEffect(() => {
    generation.current++; setArt(null); setReview(false); job.current = null;
    const timer = setTimeout(() => void generate(), 450);
    return () => { clearTimeout(timer); generation.current++; };
  }, [generate]);
  const effectiveCaption = instagramBrandedCaption(caption);
  const saveStyle = () => {
    if (!store) return;
    try { localStorage.setItem(`instagram-design:${store.id}`, JSON.stringify(savedInstagramDesign(design, store.cor_primaria))); toast.success('Estilo salvo para esta loja neste navegador.'); }
    catch { toast.error('O navegador não permitiu salvar o estilo.'); }
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
    if (!art || !product || !store || !ready || busy || generating) return;
    setBusy(true); setError(''); setProgress('Enviando sua arte…'); setReview(false);
    try {
      job.current ||= crypto.randomUUID();
      const data = await instagramFetch('/api/creator/instagram/posts', { method: 'POST', body: JSON.stringify({ action: 'prepare', id: job.current, productId: product.id, expectedUpdatedAt: product.updated_at || null, target, caption: effectiveCaption, size: art.size }) });
      if (data.uploadUrl) {
        const response = await fetch(data.uploadUrl, { method: 'PUT', headers: data.uploadHeaders, body: art, signal: AbortSignal.timeout(90000) });
        if (!response.ok) throw new Error('O envio da sua arte não terminou. Confira sua conexão antes de retomar.');
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
  if (loading) return <div className="flex items-center gap-3 p-8 text-slate-500"><Loader2 className="h-5 w-5 animate-spin" />Abrindo seu estúdio…</div>;
  return <>
    {query.get("conexao") && <p role="status" className="mb-4 rounded-xl bg-blue-50 p-4 text-sm text-blue-900">{query.get("conexao") === "conectada" ? "Conta conectada. Confira o perfil antes de publicar." : query.get("conexao") === "cancelada" ? "Conexão cancelada. Nenhuma publicação foi enviada." : "Não foi possível concluir a conexão. Abra uma nova autorização e tente novamente."}</p>}
    {error && <p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
    <InstagramStudioView store={store} products={products} product={product} productId={productId} onProduct={setProductId}
      target={target} onTarget={setTarget} design={design} onDesign={setDesign} onBackground={setBackgroundUrl} onLogo={setLogoUrl} onSaveStyle={saveStyle} imageUrl={imageUrl} onImage={setImageUrl}
      snapshot={snapshot} connected={connected} ready={!!ready} busy={busy} generating={generating} preview={preview} hasArt={!!art}
      caption={caption} effectiveCaption={effectiveCaption} onCaption={value => { setCaption(value); job.current = null; setReview(false); }}
      review={review} onReview={setReview} progress={progress} onGenerate={generate} onConnect={connect} onDisconnect={disconnect}
      onPublish={publish} onCheckPost={checkPost} statusLabels={STATUS} />
  </>;
}
export default function InstagramPage() { return <Suspense fallback={<div className="p-8 text-slate-500">Carregando estúdio…</div>}><InstagramWorkspace /></Suspense>; }
