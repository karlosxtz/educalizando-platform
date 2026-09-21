'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, FileText, Gift, GraduationCap, Rocket, ShoppingBag, Store as StoreIcon, Tag, Zap } from 'lucide-react';
import type { Product, Store } from '@/lib/types';
import { useCart } from '@/components/store/CartContext';

interface ProductCardProps {
  product: Product & { store?: Store };
  purchaseMode?: 'standard' | 'plr';
}

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const materialLabel = (tipo: Product['tipo']) => tipo.toUpperCase();

export default function ProductCard({ product, purchaseMode = 'standard' }: ProductCardProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [imageError, setImageError] = useState(false);
  const itemTitle = product.titulo || 'Material didático';
  const itemCover = product.capa_url || null;
  const storeName = product.store?.nome_loja || 'Loja parceira';
  const isPlrMode = purchaseMode === 'plr' && product.is_plr === true;
  const standardPrice = Number(product.preco || 0);
  const originalPrice = Number(product.preco_original || 0);
  const plrPrice = Number(product.preco_plr || 0);
  const purchasePrice = isPlrMode ? plrPrice : standardPrice;
  const isFree = !isPlrMode && (product.is_free || standardPrice === 0);
  const hasDiscount = !isPlrMode && !isFree && originalPrice > standardPrice;
  const discountPercent = hasDiscount ? Math.round((1 - standardPrice / originalPrice) * 100) : 0;
  const storeSlug = product.store?.slug || product.store_id;
  const productLink = `/produto/${product.slug || product.id}${isPlrMode ? '?licenca=plr' : ''}`;
  const handleAdd = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (isFree) {
      router.push(productLink);
      return;
    }
    addToCart({ productId: product.id, title: product.titulo, price: purchasePrice, isPlr: isPlrMode, storeId: product.store_id, type: product.tipo, imageUrl: product.capa_url || undefined, quantity: 1 });
  };
  const handleBuy = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (isFree) {
      router.push(productLink);
      return;
    }
    addToCart({ productId: product.id, title: product.titulo, price: purchasePrice, isPlr: isPlrMode, storeId: product.store_id, type: product.tipo, imageUrl: product.capa_url || undefined, quantity: 1 });
    const checkoutParams = new URLSearchParams({ produtoId: product.id });
    if (isPlrMode) checkoutParams.set('licenca', 'plr');
    router.push(`/loja/${storeSlug}/checkout?${checkoutParams.toString()}`);
  };

  return <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
    <Link href={productLink} aria-label={`Abrir detalhes de ${itemTitle}`} className="relative block aspect-square w-full overflow-hidden bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-blue-600">
      {itemCover && !imageError ? <img src={itemCover} alt={`Capa do material: ${itemTitle}`} width={600} height={600} loading="lazy" decoding="async" className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]" onError={() => setImageError(true)} /> : <div role="img" aria-label={`Material sem capa: ${itemTitle}`} className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400"><BookOpen aria-hidden="true" className="h-12 w-12" /></div>}
      <div className="absolute left-2 top-2 flex max-w-[calc(100%-1rem)] flex-wrap gap-1.5">
        {isPlrMode && <span className="inline-flex items-center gap-1 rounded-full bg-violet-700 px-2 py-1 text-[11px] font-bold text-white shadow-sm"><Rocket aria-hidden="true" className="h-3 w-3" />Licença PLR</span>}
        {!isPlrMode && isFree && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-1 text-[11px] font-bold text-white shadow-sm"><Gift aria-hidden="true" className="h-3 w-3" />Grátis</span>}
        {hasDiscount && <span className="inline-flex items-center gap-1 rounded-full bg-orange-600 px-2 py-1 text-[11px] font-bold text-white shadow-sm"><Tag aria-hidden="true" className="h-3 w-3" />Oferta{discountPercent > 0 ? ` · ${discountPercent}%` : ''}</span>}
      </div>
    </Link>
    <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-4">
      <Link href={productLink} className="min-w-0 focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"><h3 title={itemTitle} className="min-h-[2.65em] break-words text-sm font-bold leading-snug text-slate-900 line-clamp-2 transition-colors group-hover:text-blue-700 sm:text-base">{itemTitle}</h3></Link>
      <div className="mt-2 flex min-h-6 flex-wrap gap-1.5">
        <span className="inline-flex min-h-6 max-w-full items-center gap-1 rounded-md bg-slate-100 px-2 text-[11px] font-semibold text-slate-700"><FileText aria-hidden="true" className="h-3 w-3 shrink-0" />{materialLabel(product.tipo)}</span>
        {product.category?.nome && <span className="max-w-full truncate rounded-md bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-800" title={product.category.nome}>{product.category.nome}</span>}
        {product.education_level?.nome && <span className="inline-flex max-w-full items-center gap-1 truncate rounded-md bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-800" title={product.education_level.nome}><GraduationCap aria-hidden="true" className="h-3 w-3 shrink-0" /><span className="truncate">{product.education_level.nome}</span></span>}
        {!isPlrMode && product.is_plr && <span className="inline-flex min-h-6 items-center gap-1 rounded-md bg-violet-50 px-2 text-[11px] font-semibold text-violet-800"><Rocket aria-hidden="true" className="h-3 w-3" />PLR disponível</span>}
      </div>
      <p className="mt-3 flex min-w-0 items-center gap-1 text-xs font-medium text-slate-600"><StoreIcon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{storeName}</span></p>
      <div className="mt-3 border-t border-slate-100 pt-3">{isPlrMode ? <div className="space-y-1"><p className="text-xs text-slate-600">Produto final: <span className="font-semibold text-slate-800">{currency.format(standardPrice)}</span></p><p className="text-sm font-bold text-violet-800">Licença PLR: {currency.format(plrPrice)}</p></div> : <div>{hasDiscount && <p className="text-xs font-medium text-slate-500 line-through">{currency.format(originalPrice)}</p>}<p className={`text-lg font-black ${isFree ? 'text-emerald-700' : hasDiscount ? 'text-orange-700' : 'text-slate-900'}`}>{isFree ? 'Grátis' : currency.format(standardPrice)}</p></div>}</div>
      <div className="mt-3 grid grid-cols-[48px_minmax(0,1fr)] gap-2">
        <button onClick={handleAdd} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600" title={isFree ? 'Ver material gratuito' : 'Adicionar ao carrinho'} aria-label={isFree ? `Ver material gratuito: ${itemTitle}` : `Adicionar ao carrinho: ${itemTitle}`}><ShoppingBag aria-hidden="true" className="h-4 w-4" /></button>
        <button onClick={handleBuy} aria-label={isFree ? `Resgatar material: ${itemTitle}` : `Comprar ${isPlrMode ? 'licença PLR de ' : ''}${itemTitle}`} className="inline-flex min-h-11 min-w-0 items-center justify-center gap-1 rounded-xl bg-blue-700 px-3 text-xs font-bold text-white transition-colors hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">{isFree ? <Gift aria-hidden="true" className="h-4 w-4" /> : <Zap aria-hidden="true" className="h-4 w-4" />}<span className="truncate">{isFree ? 'Resgatar' : isPlrMode ? 'Comprar PLR' : 'Comprar'}</span></button>
      </div>
    </div>
  </article>;
}
