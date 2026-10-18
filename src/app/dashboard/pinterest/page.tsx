'use client';
import { useCallback, useEffect, useState } from 'react';
import { ArrowUpRight, CheckCircle2, ImagePlus, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { instagramFetch as integrationFetch } from '@/lib/instagram-client';
import { getCurrentCreatorStore, getProductsByStoreId } from '@/lib/store-service';
import { pinterestPin, type PinterestBoard, type PinterestSnapshot, type PinterestJob } from '@/lib/pinterest-contract';
import type { Product, Store } from '@/lib/types';

const button = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-700 px-5 text-sm font-bold text-white transition hover:bg-rose-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 disabled:cursor-not-allowed disabled:opacity-40';
const input = 'mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800';
const STATUS: Record<PinterestJob['status'], string> = { queued: 'Na fila', processing: 'Enviando', published: 'Publicado', failed: 'Não publicado', uncertain: 'Confira o Pinterest', cancelled: 'Cancelado' };
export default function PinterestPage() {
  const [snapshot, setSnapshot] = useState<PinterestSnapshot | null>(null), [store, setStore] = useState<Store | null>(null), [products, setProducts] = useState<Product[]>([]);
  const [boards, setBoards] = useState<PinterestBoard[]>([]), [bookmark, setBookmark] = useState<string | null>(null), [boardsLoaded, setBoardsLoaded] = useState(false);
  const [boardId, setBoardId] = useState(''), [automatic, setAutomatic] = useState(false), [productId, setProductId] = useState('');
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState(''), [review, setReview] = useState(false);
  const refresh = useCallback(async () => {
    const data = await integrationFetch('/api/creator/pinterest') as PinterestSnapshot;
    setSnapshot(data); setBoardId(data.account?.board_id || ''); setAutomatic(data.account?.auto_publish || false);
    return data;
  }, []);
  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const current = await getCurrentCreatorStore();
        const [catalog, status] = await Promise.all([getProductsByStoreId(current.id), integrationFetch('/api/creator/pinterest')]);
        if (!alive) return;
        setStore(current); setProducts(catalog.filter(product => product.status === 'publicado' && !product.excluido_em));
        const data = status as PinterestSnapshot; setSnapshot(data); setBoardId(data.account?.board_id || ''); setAutomatic(data.account?.auto_publish || false);
        const result = new URLSearchParams(window.location.search).get('conexao');
        if (result === 'conectada') toast.success('Pinterest conectado! Escolha a pasta para seus materiais.');
        else if (result) setError(result === 'cancelada' ? 'A conexão foi cancelada. Você pode tentar novamente.' : 'Não foi possível concluir a conexão. Tente conectar novamente.');
      } catch (cause) { if (alive) setError(cause instanceof Error ? cause.message : 'Não foi possível abrir o Pinterest.'); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);
  const act = async (work: () => Promise<void>) => {
    if (busy) return;
    setBusy(true); setError('');
    try { await work(); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível concluir a operação.'); }
    finally { setBusy(false); }
  };
  const loadBoards = (more = false) => act(async () => {
    const data = await integrationFetch('/api/creator/pinterest?boards=1' + (more && bookmark ? '&bookmark=' + encodeURIComponent(bookmark) : ''));
    setBoards(previous => { const all = more ? [...previous, ...data.boards] : data.boards; return Array.from(new Map(all.map((item: PinterestBoard) => [item.id, item])).values()) as PinterestBoard[]; });
    setBookmark(data.bookmark); setBoardsLoaded(true);
  });
  const ready = !!snapshot?.configured && !snapshot.migrationRequired;
  const product = products.find(item => item.id === productId);
  let preview: ReturnType<typeof pinterestPin> | null = null, previewError = '';
  if (product && store) { try { preview = pinterestPin(product, store, boardId || '0', true); } catch (cause) { previewError = cause instanceof Error ? cause.message : 'Confira a capa do produto.'; } }
  const existing = snapshot?.jobs.find(item => item.product_id === productId);
  const canQueue = ready && !!snapshot?.account?.board_id && !!preview && (!existing || ['failed', 'cancelled'].includes(existing.status));
  if (loading) return <div role="status" className="flex items-center justify-center gap-3 p-16 text-slate-500"><Loader2 className="h-5 w-5 animate-spin" />Preparando seu Pinterest…</div>;
  return <div className="mx-auto max-w-6xl space-y-6 pb-12">
    <header className="relative overflow-hidden rounded-[28px] border border-rose-200 bg-gradient-to-br from-rose-50 via-white to-orange-50 p-6 sm:p-8">
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-700 to-orange-400" />
      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-rose-700">Divulgue seus materiais</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">Sua loja no Pinterest</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">Transforme seus materiais publicados em Pins com imagem, descrição e link para sua loja. Escolha uma pasta e deixe os próximos lançamentos entrarem na fila automaticamente.</p>
      <p className="mt-4 text-xs font-semibold text-rose-800">{store?.nome_loja} · Conexão individual da sua loja</p>
    </header>
    {error && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-800">{error}</div>}
    {!ready && <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><h2 className="font-bold text-amber-950">Integração em preparação</h2><p className="mt-2 text-sm leading-7 text-amber-900">A conexão e os envios serão liberados após a ativação do aplicativo Pinterest pela Educalizando.{snapshot?.migrationRequired ? ' As tabelas desta integração ainda aguardam ativação.' : ''} Você não precisa enviar senha ou token ao suporte.</p></section>}
    {ready && snapshot?.sandbox && <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">Modo de testes do Pinterest: os Pins não representam uma publicação pública de produção. A liberação geral depende da aprovação do aplicativo pelo Pinterest.</p>}
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="flex items-center gap-2 font-bold text-slate-900"><ShieldCheck className="h-5 w-5 text-rose-600" />{snapshot?.account ? '@' + snapshot.account.username : '1. Conecte seu Pinterest'}</h2><p className="mt-2 text-sm text-slate-500">A autorização acontece no Pinterest. Sua senha fica lá.</p></div><button disabled={busy || !ready} className={button} onClick={() => void act(async () => { const data = await integrationFetch('/api/creator/pinterest', { method: 'POST', body: JSON.stringify({ action: 'connect' }) }); window.location.assign(data.authorizationUrl); })}>{snapshot?.account ? 'Reconectar conta' : 'Conectar Pinterest'}</button></div>
      {snapshot?.account && <div className="mt-6 space-y-5 border-t border-slate-100 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-sm font-bold text-slate-800">2. Escolha a pasta dos materiais</h3><button disabled={busy} className="min-h-10 text-xs font-bold text-rose-700" onClick={() => void loadBoards()}>Carregar pastas do Pinterest</button></div>
        <label className="block text-xs font-semibold text-slate-600">Pasta pública<select disabled={busy} value={boardId} onChange={event => setBoardId(event.target.value)} className={input}><option value="">Selecione uma pasta</option>{snapshot.account.board_id && !boards.some(item => item.id === snapshot.account!.board_id) && <option value={snapshot.account.board_id}>{snapshot.account.board_name}</option>}{boards.map(board => <option key={board.id} value={board.id}>{board.name}</option>)}</select></label>
        {bookmark && <button disabled={busy} onClick={() => void loadBoards(true)} className="text-xs font-bold text-rose-700">Carregar mais pastas</button>}
        {boardsLoaded && !boards.length && <p className="text-sm text-slate-500">Nenhuma pasta pública encontrada. Crie uma pasta na sua conta Pinterest e clique em carregar novamente.</p>}
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50/50 p-4"><input disabled={busy || !ready} type="checkbox" checked={automatic} onChange={event => setAutomatic(event.target.checked)} className="mt-1 h-4 w-4 accent-rose-700" /><span><strong className="block text-sm text-slate-900">Publicar novos materiais automaticamente</strong><span className="mt-1 block text-xs leading-6 text-slate-600">Autorizo criar um Pin na pasta escolhida quando um novo material da minha loja for publicado. Rascunhos não são enviados. O catálogo antigo só é enviado quando eu selecionar um material e confirmar.</span></span></label>
        <div className="flex flex-wrap items-center justify-between gap-3"><button disabled={busy || !ready || !boardId} className={button} onClick={() => void act(async () => { await integrationFetch('/api/creator/pinterest', { method: 'POST', body: JSON.stringify({ action: 'settings', boardId, autoPublish: automatic }) }); await refresh(); toast.success('Preferências do Pinterest salvas.'); })}>Salvar preferências</button><button disabled={busy} className="min-h-11 text-xs font-semibold text-slate-500" onClick={() => void act(async () => { await integrationFetch('/api/creator/pinterest', { method: 'DELETE' }); setBoards([]); setBoardsLoaded(false); setReview(false); await refresh(); toast.success('Pinterest desconectado desta loja.'); })}>Desconectar desta loja</button></div>
        <p className="text-xs leading-6 text-slate-500">{snapshot.account.auto_publish ? 'Automação ativa para os próximos materiais publicados.' : 'Automação pausada.'} Os envios usam uma fila e podem levar alguns minutos. Pausar ou desconectar cancela envios ainda na fila; um envio já iniciado pode terminar.</p>
      </div>}
    </section>
    <section className="grid gap-6 rounded-[24px] border border-slate-200 bg-white p-5 sm:p-6 lg:grid-cols-[1fr_300px]">
      <div><h2 className="text-lg font-bold text-slate-900">Divulgue um material já publicado</h2><p className="mt-2 text-sm leading-7 text-slate-500">O Pin utiliza a capa e a descrição cadastradas, com um link para o produto na sua loja. Nenhuma informação do cadastro será alterada.</p><label className="mt-5 block text-xs font-semibold text-slate-600">Material<select value={productId} disabled={busy} onChange={event => { setProductId(event.target.value); setReview(false); }} className={input}><option value="">Escolha um material publicado</option>{products.map(item => <option key={item.id} value={item.id}>{item.titulo}</option>)}</select></label>
        {previewError && <p className="mt-3 text-sm text-amber-800">{previewError}</p>}
        {existing && <p className="mt-3 text-xs font-semibold text-slate-600">Situação mais recente: {STATUS[existing.status]}. {existing.status === 'uncertain' ? 'Confira sua conta antes de qualquer novo envio.' : ''}</p>}
        <button disabled={busy || !canQueue} onClick={() => setReview(true)} className={button + ' mt-5'}>Revisar envio ao Pinterest<ArrowUpRight className="h-4 w-4" /></button>
        {review && canQueue && <div className="mt-4 space-y-3 rounded-2xl border border-rose-200 bg-rose-50 p-4"><p className="text-sm leading-7 text-rose-950">Confirma criar um Pin de <strong>{product?.titulo}</strong> em <strong>@{snapshot?.account?.username}</strong>, na pasta <strong>{snapshot?.account?.board_name}</strong>?</p><button disabled={busy} className={button} onClick={() => void act(async () => { await integrationFetch('/api/creator/pinterest/posts', { method: 'POST', body: JSON.stringify({ productId }) }); setReview(false); await refresh(); toast.success('Material adicionado à fila do Pinterest.'); })}>Confirmar e colocar na fila</button><button onClick={() => setReview(false)} className="ml-3 min-h-10 text-xs font-semibold text-slate-600">Voltar</button></div>}
      </div>
      <aside className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 p-4"><h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Prévia do conteúdo</h3>{preview ? <><img src={preview.media_source.url} width={600} height={900} alt={preview.alt_text} className="mt-4 max-h-80 w-full rounded-xl object-contain" /><h4 className="mt-4 text-sm font-bold text-slate-900">{preview.title}</h4><p className="mt-2 whitespace-pre-line text-xs leading-6 text-slate-600">{preview.description}</p><a href={preview.link} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-10 items-center text-xs font-bold text-rose-700">Ver destino na loja<ArrowUpRight className="ml-1 h-3 w-3" /></a><p className="text-[10px] leading-5 text-slate-400">O Pinterest define o visual final do Pin. O link inclui identificação de tráfego orgânico do Pinterest.</p></> : <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-slate-400"><ImagePlus className="h-8 w-8" /><p className="text-xs">Selecione um material para visualizar.</p></div>}</aside>
    </section>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 font-bold text-slate-900"><CheckCircle2 className="h-5 w-5 text-rose-600" />Histórico de Pins</h2><button disabled={busy} onClick={() => void act(async () => { await refresh(); })} className="inline-flex min-h-11 items-center gap-2 text-xs font-bold text-slate-600"><RefreshCw className={'h-4 w-4 ' + (busy ? 'animate-spin' : '')} />Atualizar histórico</button></div><p className="mt-2 text-xs leading-6 text-slate-500">Um Pin por material evita publicações repetidas. Se houver dúvida sobre o resultado, o envio não será repetido automaticamente.</p><div className="mt-4 divide-y divide-slate-100">{snapshot?.jobs.length ? snapshot.jobs.map(job => <div key={job.id} className="flex flex-wrap items-start justify-between gap-3 py-4"><div><p className="text-sm font-semibold text-slate-800">{job.title}</p><p className="mt-1 text-xs text-slate-500">{STATUS[job.status]} · {new Date(job.created_at).toLocaleString('pt-BR')}</p>{job.error_message && <p className="mt-2 max-w-xl text-xs leading-6 text-amber-800">{job.error_message}</p>}</div>{job.status === 'published' && job.pin_id && <a href={'https://www.pinterest.com/pin/' + job.pin_id + '/'} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1 text-xs font-bold text-rose-700">Abrir Pin<ArrowUpRight className="h-3 w-3" /></a>}</div>) : <p className="py-5 text-sm text-slate-400">Seus próximos envios aparecerão aqui.</p>}</div></section>
    <details className="rounded-2xl border border-slate-200 bg-white p-5"><summary className="cursor-pointer text-sm font-bold text-slate-800">Como usar para divulgar sua loja</summary><ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-7 text-slate-600"><li>Conecte seu Pinterest e escolha uma pasta pública relacionada aos materiais.</li><li>Ative a automação para novos lançamentos ou envie um produto existente após revisar.</li><li>Use capas claras e descrições completas no cadastro do produto: elas serão a base do Pin.</li><li>Confira o histórico e abra o Pin publicado. Quem clicar no link poderá conhecer o material na sua loja.</li></ol><p className="mt-4 text-xs leading-6 text-slate-500">A integração não cria anúncios pagos e não garante alcance ou vendas. Arquivos pagos, dados de clientes e links de entrega não são enviados.</p></details>
  </div>;
}
