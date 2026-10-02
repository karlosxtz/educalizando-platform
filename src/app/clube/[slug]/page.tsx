'use client';

import { ArrowLeft,BookOpen,CheckCircle2,Crown,Loader2,LockKeyhole,Package,ShieldCheck,Sparkles } from 'lucide-react';
import Link from 'next/link';
import { use,useEffect,useState } from 'react';

type StoreData = { nome_loja: string; slug: string; logo_url: string | null };
type PublicClubData = {
  club: { id: string; name: string; description: string; cover_url: string | null; monthly_price: number; stores: StoreData | StoreData[] };
  products: Array<{ id: string; titulo: string; capa_url: string | null }>;
};

function ClubCover({ src, name }: { src: string | null; name: string }) {
  if (!src) return <div className="flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-blue-950 via-blue-700 to-violet-700 text-white"><Crown className="h-20 w-20" /></div>;
  return <div className="relative aspect-[16/9] overflow-hidden bg-slate-100"><img src={src} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover opacity-30 blur-2xl" /><div className="absolute inset-0 bg-gradient-to-t from-slate-950/15 via-transparent to-white/10" /><img src={src} alt={`Capa do ${name}`} className="relative z-10 h-full w-full object-contain" /></div>;
}

export default function PublicCreatorClubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [data, setData] = useState<PublicClubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/creator-clubs/public/${encodeURIComponent(slug)}`, { cache: 'no-store' })
      .then(async (response) => { const payload = await response.json(); if (!response.ok) throw new Error(payload.error); setData(payload); })
      .catch((caught) => setError(caught.message))
      .finally(() => setLoading(false));
  }, [slug]);

  async function subscribe() {
    if (!data) return;
    setPaying(true); setError('');
    try {
      const response = await fetch(`/api/creator-clubs/${data.club.id}/checkout`, { method: 'POST' });
      const payload = await response.json();
      if (response.status === 401) { window.location.assign(new URL(`/cliente/login?action=buy&returnTo=${encodeURIComponent(`/clube/${slug}`)}`, window.location.origin)); return; }
      if (!response.ok) throw new Error(payload.error);
      window.location.assign(payload.checkoutUrl || payload.redirectUrl);
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Não foi possível continuar.'); setPaying(false); }
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-50"><div className="text-center"><Loader2 className="mx-auto h-9 w-9 animate-spin text-blue-700" /><p className="mt-3 text-sm font-bold text-slate-500">Preparando o clube…</p></div></div>;
  if (!data) return <div className="mx-auto mt-20 max-w-lg rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center font-bold text-rose-800">{error || 'Clube indisponível.'}</div>;

  const club = data.club;
  const store = Array.isArray(club.stores) ? club.stores[0] : club.stores;
  return <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#eff6ff,_#f8fafc_42%)]">
    <nav className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl"><div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6"><Link href={`/loja/${store?.slug || ''}`} className="flex min-w-0 items-center gap-3 rounded-xl p-1.5 transition hover:bg-slate-50"><ArrowLeft className="h-5 w-5 shrink-0 text-slate-500" />{store?.logo_url ? <img src={store.logo_url} alt="" className="h-10 w-10 rounded-full border object-cover" /> : <img src="/branding/logo-educalizando.png?v=3" alt="Educalizando" className="h-10 w-auto" />}<span className="hidden truncate text-sm font-black text-slate-800 sm:block">Voltar para {store?.nome_loja}</span></Link><Link href="/cliente/clubes" className="rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-black text-blue-800 transition hover:bg-blue-100">Meus Clubes</Link></div></nav>

    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12"><div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1.35fr)_minmax(340px,.65fr)]">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/60"><ClubCover src={club.cover_url} name={club.name} /><div className="p-6 sm:p-9"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[.18em] text-blue-700">Clube de {store?.nome_loja}</span><span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-black text-emerald-700"><ShieldCheck className="h-3.5 w-3.5" />Compra protegida</span></div><h1 className="mt-5 text-3xl font-black leading-tight text-slate-950 sm:text-5xl">{club.name}</h1><p className="mt-5 whitespace-pre-line text-base leading-7 text-slate-600">{club.description}</p></div></div>

      <aside className="lg:sticky lg:top-24"><div className="overflow-hidden rounded-[2rem] border border-blue-200 bg-white shadow-2xl shadow-blue-950/10"><div className="bg-gradient-to-r from-blue-800 to-violet-700 px-6 py-5 text-white"><p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-100"><Crown className="h-4 w-4" />Assinatura do clube</p><p className="mt-2 text-sm text-blue-100">Acesso completo por 30 dias</p></div><div className="p-6 sm:p-7"><p className="text-xs font-black uppercase tracking-widest text-slate-500">Valor da assinatura</p><p className="mt-2 text-4xl font-black text-slate-950 sm:text-5xl">{Number(club.monthly_price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}<span className="ml-1 text-sm text-slate-500">/ 30 dias</span></p><div className="my-6 h-px bg-slate-100" /><div className="space-y-4 text-sm font-bold text-slate-700"><p className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />Acesso imediato aos {data.products.length} materiais listados</p><p className="flex items-start gap-3"><BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />Novos materiais entram no acervo sem custo individual</p><p className="flex items-start gap-3"><LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />Liberação automática após o pagamento confirmado</p></div>{error && <p className="mt-5 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p>}<button onClick={() => void subscribe()} disabled={paying} className="mt-7 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 font-black text-white shadow-lg shadow-blue-700/20 transition hover:-translate-y-0.5 hover:bg-blue-800 disabled:opacity-60">{paying ? <Loader2 className="h-5 w-5 animate-spin" /> : <Crown className="h-5 w-5" />}{paying ? 'Abrindo pagamento…' : 'Assinar este clube'}</button><p className="mt-4 text-center text-xs leading-5 text-slate-500">Pagamento seguro pela InfinitePay. O acesso aparecerá em <strong>Meus Clubes</strong>.</p></div></div></aside>
    </div>

      <section className="mt-12"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="flex items-center gap-2 text-xs font-black uppercase tracking-[.18em] text-blue-700"><Sparkles className="h-4 w-4" />Acervo da assinatura</p><h2 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">Tudo o que vem no clube</h2><p className="mt-2 text-sm text-slate-500">{data.products.length} materiais disponíveis agora. O acervo pode crescer a qualquer momento.</p></div><span className="w-fit rounded-full bg-blue-700 px-4 py-2 text-xs font-black text-white">{data.products.length} materiais incluídos</span></div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">{data.products.map((product) => <article key={product.id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><div className="relative aspect-[4/3] overflow-hidden bg-slate-100">{product.capa_url ? <><img src={product.capa_url} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover opacity-20 blur-lg" /><img src={product.capa_url} alt={product.titulo} className="relative z-10 h-full w-full object-contain transition duration-300 group-hover:scale-[1.03]" /></> : <div className="flex h-full items-center justify-center text-blue-300"><Package className="h-10 w-10" /></div>}</div><div className="p-3.5 sm:p-4"><p className="mb-2 text-[10px] font-black uppercase tracking-wider text-blue-700">Incluído no clube</p><h3 className="line-clamp-3 text-sm font-black leading-5 text-slate-900">{product.titulo}</h3></div></article>)}</div>
      </section>
    </section>
  </main>;
}
