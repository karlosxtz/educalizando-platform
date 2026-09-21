'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, Loader2, Minus, PackageOpen, Plus, ShoppingCart, Store as StoreIcon, Trash2 } from 'lucide-react';
import { useCart } from '@/components/store/CartContext';
import { supabase } from '@/lib/supabase';
import { CartItem } from '@/lib/cart-service';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import Footer from '@/components/Footer';

type StoreSummary = { nome_loja: string; slug: string };
const formatPrice = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, clearCart } = useCart();
  const router = useRouter();
  const [storeMap, setStoreMap] = useState<Record<string, StoreSummary>>({});
  const [loadingStores, setLoadingStores] = useState(true);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const [checkoutStoreId, setCheckoutStoreId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const headingRef = useRef<HTMLHeadingElement>(null);

  const groupedItems = items.reduce((acc, item) => {
    (acc[item.storeId] ||= []).push(item);
    return acc;
  }, {} as Record<string, CartItem[]>);
  const storeIds = Object.keys(groupedItems);
  const storeIdsKey = storeIds.join(',');

  useEffect(() => {
    async function fetchStores() {
      const ids = storeIdsKey ? storeIdsKey.split(',') : [];
      if (ids.length === 0) { setLoadingStores(false); return; }
      setLoadingStores(true);
      try {
        const { data, error } = await supabase.from('stores').select('id, nome_loja, slug').in('id', ids);
        if (data && !error) {
          setStoreMap(data.reduce<Record<string, StoreSummary>>((map, store) => {
            map[store.id] = { nome_loja: store.nome_loja, slug: store.slug };
            return map;
          }, {}));
        }
      } catch {
        // O carrinho continua utilizável com a identificação local da loja.
      } finally {
        setLoadingStores(false);
      }
    }
    void fetchStores();
  }, [storeIdsKey]);

  const handleRemove = (item: CartItem) => {
    setRemovingItemId(item.id);
    try {
      removeFromCart(item.id);
      setAnnouncement(`${item.title} foi removido do carrinho.`);
    } finally {
      setRemovingItemId(null);
      window.requestAnimationFrame(() => headingRef.current?.focus());
    }
  };

  const handleClearCart = () => {
    clearCart();
    setAnnouncement('Todos os itens foram removidos do carrinho.');
  };

  const handleCheckout = (storeId: string, storeSlug?: string) => {
    if (!storeSlug || checkoutStoreId) return;
    setCheckoutStoreId(storeId);
    router.push(`/loja/${storeSlug}/checkout`);
  };

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50 font-sans">
        <MarketplaceHeader />
        <main className="flex flex-1 items-center justify-center px-4 py-12 sm:py-16">
          <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-10" aria-labelledby="empty-cart-title">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><ShoppingCart className="h-8 w-8" aria-hidden="true" /></div>
            <h1 id="empty-cart-title" className="text-2xl font-black tracking-tight text-slate-900">Seu carrinho está vazio</h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">Escolha materiais didáticos no marketplace para revisar e finalizar sua compra por loja.</p>
            <Link href="/buscar" className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-black text-white shadow-md shadow-blue-500/20 transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">Explorar materiais</Link>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans">
      <MarketplaceHeader />
      <main className="flex-1 px-4 py-6 pb-12 sm:px-6 sm:py-10 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-blue-700">Revisão do pedido</p>
              <h1 ref={headingRef} tabIndex={-1} className="mt-1 text-2xl font-black tracking-tight text-slate-900 outline-none sm:text-3xl">Seu carrinho</h1>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">Cada loja tem um checkout próprio. Revise os itens e avance na loja desejada.</p>
            </div>
            <button type="button" onClick={handleClearCart} className="inline-flex min-h-11 items-center self-start rounded-xl px-3 text-sm font-bold text-rose-700 transition-colors hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600"><Trash2 className="mr-2 h-4 w-4" aria-hidden="true" /> Esvaziar carrinho</button>
          </div>
          <p className="sr-only" aria-live="polite">{announcement}</p>

          {loadingStores ? (
            <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center text-sm font-semibold text-slate-500" role="status">Organizando os itens por loja...</div>
          ) : (
            <div className="grid grid-cols-1 gap-7 lg:grid-cols-12 lg:gap-8">
              <section className="min-w-0 space-y-6 lg:col-span-8" aria-label="Itens do carrinho">
                {Object.entries(groupedItems).map(([storeId, storeItems]) => {
                  const storeData = storeMap[storeId];
                  const storeName = storeData?.nome_loja || 'Loja do material';
                  return (
                    <section key={storeId} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm" aria-labelledby={`store-${storeId}`}>
                      <header className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 sm:px-6 sm:py-4">
                        <div className="flex min-w-0 items-center gap-2.5"><StoreIcon className="h-5 w-5 shrink-0 text-blue-700" aria-hidden="true" /><div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Pedido separado</p><h2 id={`store-${storeId}`} className="truncate text-base font-black text-slate-900 sm:text-lg" title={storeName}>{storeName}</h2></div></div>
                        {storeData?.slug && <Link href={`/loja/${storeData.slug}`} className="shrink-0 text-xs font-black text-blue-700 hover:text-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">Ver loja</Link>}
                      </header>
                      <ul className="divide-y divide-slate-100">
                        {storeItems.map((item) => {
                          const lineSubtotal = item.price * item.quantity;
                          const isRemoving = removingItemId === item.id;
                          return (
                            <li key={item.id} className="p-4 sm:p-5">
                              <div className="flex items-start gap-3 sm:gap-4">
                                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 sm:h-24 sm:w-24">{item.imageUrl ? <img src={item.imageUrl} alt={`Capa de ${item.title}`} className="h-full w-full object-contain" /> : <PackageOpen className="h-7 w-7 text-slate-300" aria-hidden="true" />}</div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-2"><div className="min-w-0"><h3 className="line-clamp-2 text-sm font-black leading-snug text-slate-900 sm:text-base" title={item.title}>{item.title}</h3><div className="mt-2 flex flex-wrap gap-1.5"><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600">{item.type}</span>{item.isPlr ? <span className="rounded-full bg-purple-100 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-purple-800">Licença PLR</span> : <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">Produto final</span>}</div></div><button type="button" onClick={() => handleRemove(item)} disabled={isRemoving} aria-label={`Remover ${item.title} do carrinho`} className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl text-rose-600 transition-colors hover:bg-rose-50 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600">{isRemoving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}</button></div>
                                  <div className="mt-4 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Preço por item</p><p className="mt-0.5 text-lg font-black text-slate-900">{formatPrice(item.price)}</p></div><div className="text-right"><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Subtotal</p><p className="mt-0.5 text-sm font-black text-slate-800">{formatPrice(lineSubtotal)}</p></div></div>
                                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3"><div className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-slate-50" aria-label={`Quantidade de ${item.title}`}><button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1 || isRemoving} aria-label={`Diminuir quantidade de ${item.title}`} className="flex h-11 w-11 items-center justify-center rounded-l-xl text-slate-600 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600"><Minus className="h-4 w-4" /></button><span className="w-9 text-center text-sm font-black text-slate-900" aria-live="polite">{item.quantity}</span><button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} disabled={item.quantity >= 10 || isRemoving} aria-label={`Aumentar quantidade de ${item.title}`} className="flex h-11 w-11 items-center justify-center rounded-r-xl text-slate-600 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600"><Plus className="h-4 w-4" /></button></div><button type="button" onClick={() => handleRemove(item)} disabled={isRemoving} className="min-h-11 rounded-xl px-3 text-xs font-black text-rose-700 hover:bg-rose-50 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600">Remover</button></div>
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  );
                })}
              </section>
              <aside className="min-w-0 space-y-5 lg:col-span-4 lg:sticky lg:top-24 lg:self-start" aria-label="Resumo dos pedidos">
                {Object.entries(groupedItems).map(([storeId, storeItems]) => {
                  const storeData = storeMap[storeId];
                  const storeName = storeData?.nome_loja || 'Loja do material';
                  const productCount = storeItems.reduce((count, item) => count + item.quantity, 0);
                  const total = storeItems.reduce((value, item) => value + (item.price * item.quantity), 0);
                  const hasPlr = storeItems.some((item) => item.isPlr);
                  const hasStandard = storeItems.some((item) => !item.isPlr);
                  const isCheckingOut = checkoutStoreId === storeId;
                  return (
                    <section key={`summary-${storeId}`} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby={`summary-${storeId}`}>
                      <div className="flex items-start gap-2.5"><StoreIcon className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" aria-hidden="true" /><div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Resumo da loja</p><h2 id={`summary-${storeId}`} className="truncate text-base font-black text-slate-900" title={storeName}>{storeName}</h2></div></div>
                      <dl className="mt-5 space-y-3 text-sm"><div className="flex items-center justify-between gap-3 text-slate-600"><dt>Subtotal ({productCount} {productCount === 1 ? 'item' : 'itens'})</dt><dd className="font-bold text-slate-900">{formatPrice(total)}</dd></div>{hasPlr && <div className="rounded-xl border border-purple-100 bg-purple-50 px-3 py-2 text-xs font-semibold leading-relaxed text-purple-900"><dt className="inline font-black">Licença PLR: </dt><dd className="inline">inclui itens de revenda nesta loja.</dd></div>}{hasPlr && hasStandard && <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-semibold leading-relaxed text-amber-900">Produtos finais e licenças PLR permanecem identificados separadamente no checkout.</div>}<div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-base font-black text-slate-900"><dt>Total</dt><dd>{formatPrice(total)}</dd></div></dl>
                      {storeData?.slug ? <button type="button" onClick={() => handleCheckout(storeId, storeData.slug)} disabled={Boolean(checkoutStoreId)} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition-colors hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">{isCheckingOut ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Abrindo checkout...</> : <>Continuar para o checkout <ArrowRight className="h-4 w-4" aria-hidden="true" /></>}</button> : <p className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-semibold text-slate-600">Não foi possível identificar a loja deste pedido. Atualize a página antes de continuar.</p>}
                      <p className="mt-3 text-center text-xs leading-relaxed text-slate-500">Você revisará as opções de pagamento no próximo passo.</p>
                      <div className="mt-4 flex items-center justify-center gap-2 border-t border-slate-100 pt-4 text-xs font-bold text-slate-600"><CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" /> Checkout separado por loja</div>
                    </section>
                  );
                })}
              </aside>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
