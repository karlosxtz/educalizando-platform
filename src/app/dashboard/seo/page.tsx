'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCurrentCreatorStore, getProductsByStoreId } from '@/lib/store-service';
import type { Product, Store } from '@/lib/types';
import ProductOpportunityReport from '@/components/dashboard/ProductOpportunityReport';

export default function CreatorSeoPage() {
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => { let active = true; void (async () => { try { const current = await getCurrentCreatorStore(); const rows = await getProductsByStoreId(current.id); if (active) { setStore(current); setProducts(rows); } } catch { if (active) setError('Não foi possível carregar os produtos. Reabra esta página para tentar novamente.'); } finally { if (active) setLoading(false); } })(); return () => { active = false; }; }, []);
  return <div className="mx-auto max-w-6xl space-y-6 pb-10"><header className="rounded-3xl bg-gradient-to-br from-blue-900 to-indigo-800 p-6 text-white sm:p-9"><p className="text-xs font-bold uppercase tracking-widest text-blue-100">Sua loja mais bem apresentada</p><h1 className="mt-3 text-3xl font-black">Plano de melhorias dos produtos</h1><p className="mt-3 max-w-3xl text-sm leading-7 text-blue-50">Revise o que ajuda o professor a encontrar e escolher seu material. As sugestões usam o cadastro real da sua loja e não alteram produtos automaticamente.</p><div className="mt-5 flex flex-wrap gap-3"><Link href="/dashboard/produtos" className="inline-flex min-h-11 items-center rounded-xl bg-white px-4 text-sm font-bold text-blue-900">Meus produtos</Link><Link href="/dashboard/metricas-anuncios" className="inline-flex min-h-11 items-center rounded-xl border border-white/40 px-4 text-sm font-bold">Métricas e anúncios</Link></div></header>
    {loading ? <p role="status" className="p-5 text-slate-600">Carregando os produtos da sua loja…</p> : error ? <p role="alert" className="rounded-xl bg-rose-50 p-5 text-rose-800">{error}</p> : store && <ProductOpportunityReport products={products} storeId={store.id} />}
    <section className="grid gap-4 md:grid-cols-3">{[{ title: '1. Conteúdo real', text: 'Mostre o que acompanha, para quem você preparou e como usar. Confirme os fatos antes de salvar textos sugeridos pela IA.' }, { title: '2. Confiança para comprar', text: 'Use capas legíveis, fotos reais e amostras públicas. Revise impressão, formato e condições da licença.' }, { title: '3. Resultado medido', text: 'Acompanhe buscas no Search Console e compras no Analytics. Uma nota de cadastro não garante indexação, primeira posição ou vendas.' }].map(item => <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-bold text-slate-900">{item.title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p></article>)}</section>
  </div>;
}
