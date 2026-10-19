'use client';
import { normalizePublicAssetUrl } from '@/lib/public-links';
import PresentationVideoPlayer from '@/components/PresentationVideoPlayer';
import { productPresentationVideo } from '@/lib/presentation-video';
import CatalogCover from '@/components/CatalogCover';
import CatalogImage from '@/components/ui/CatalogImage';

import { useCart } from '@/components/store/CartContext';
import type { Product,Store } from '@/lib/types';
import { FileText,Gift,GraduationCap,Rocket,ShoppingBag,Store as StoreIcon,Tag,Zap } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ProductCardProps {
  product: Product & { store?: Store };
  purchaseMode?: 'standard' | 'plr';
  presentation?: 'default' | 'showcase' | 'campaign';
  priority?: boolean;
}

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const materialLabel = (tipo: Product['tipo']) => tipo.toUpperCase();

export default function ProductCard({ product, purchaseMode = 'standard', presentation = 'default', priority = false }: ProductCardProps) {
  const publicVideo = productPresentationVideo(product);
  const compact = presentation === 'campaign';
  const showcase = presentation === 'showcase' || compact;
  const router = useRouter();
  const { addToCart } = useCart();
  const itemTitle = product.titulo || 'Material didático';
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

  const cover = (
    <Link prefetch={false} href={productLink} aria-label={`Abrir detalhes de ${itemTitle}`} className={`relative block w-full overflow-hidden bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-blue-600 ${compact ? 'h-40 sm:h-44' : 'aspect-square'}`}>
      <CatalogCover value={product.capa_url} title={itemTitle} priority={priority} className={`h-full w-full ${showcase ? "object-contain" : "object-cover sm:object-contain"} transition-transform duration-300 group-hover:scale-[1.03]`} />
      <div className="absolute left-2 top-2 flex max-w-[calc(100%-1rem)] flex-wrap gap-1.5">
        {isPlrMode && <span className="inline-flex items-center gap-1 rounded-full bg-violet-700 px-2 py-1 text-[11px] font-bold text-white shadow-sm"><Rocket aria-hidden="true" className="h-3 w-3" />Licença PLR</span>}
        {!isPlrMode && isFree && <span className="inline-flex items-center gap-1 rounded-full bg-blue-700 px-2 py-1 text-[11px] font-bold text-white shadow-sm"><Gift aria-hidden="true" className="h-3 w-3" />Grátis</span>}
        {hasDiscount && <><span className="inline-flex items-center rounded-full bg-blue-700 px-2 py-1 text-[10px] font-black text-white shadow-sm sm:hidden">-{discountPercent}%</span><span className="hidden items-center gap-1 rounded-full bg-orange-600 px-2 py-1 text-[11px] font-bold text-white shadow-sm sm:inline-flex"><Tag aria-hidden="true" className="h-3 w-3" />Oferta{discountPercent > 0 ? ` · ${discountPercent}%` : ''}</span></>}
      </div>
    </Link>
  );
  return <article className={`group flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.08)] transition-all hover:-translate-y-0.5 hover:shadow-md sm:rounded-2xl`}>
    {publicVideo && product.video_as_cover ? <PresentationVideoPlayer url={publicVideo.url} title={itemTitle} hoverPreview className="w-full">{cover}</PresentationVideoPlayer> : cover}
    <div className={`flex min-h-0 flex-1 flex-col ${compact ? "p-4" : showcase ? "p-5" : "p-2 sm:p-4"}`}>
      <Link prefetch={false} href={productLink} className="min-w-0 focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"><h3 title={itemTitle} className={`min-h-[2.7em] break-words font-bold text-slate-900 transition-colors group-hover:text-blue-700 ${compact ? "text-sm leading-snug" : showcase ? "text-base leading-snug" : "text-[12px] leading-[1.35] line-clamp-2 sm:text-base sm:leading-snug"}`}>{itemTitle}</h3></Link>
      <div className={`mt-2 min-h-6 flex-wrap gap-1.5 ${showcase ? "flex" : "hidden sm:flex"}`}>
        <span className="inline-flex min-h-6 max-w-full items-center gap-1 rounded-md bg-slate-100 px-2 text-[11px] font-semibold text-slate-700"><FileText aria-hidden="true" className="h-3 w-3 shrink-0" />{materialLabel(product.tipo)}</span>
        {product.category?.nome && <span className="max-w-full truncate rounded-md bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-800" title={product.category.nome}>{product.category.nome}</span>}
        {product.education_level?.nome && <span className="inline-flex max-w-full items-center gap-1 truncate rounded-md bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-800" title={product.education_level.nome}><GraduationCap aria-hidden="true" className="h-3 w-3 shrink-0" /><span className="truncate">{product.education_level.nome}</span></span>}
        {!isPlrMode && product.is_plr && <span className="inline-flex min-h-6 items-center gap-1 rounded-md bg-violet-50 px-2 text-[11px] font-semibold text-violet-800"><Rocket aria-hidden="true" className="h-3 w-3" />PLR disponível</span>}
      </div>
      <p className={`mt-2 flex min-w-0 items-center gap-1.5 border-b border-slate-100 pb-2 font-medium text-slate-500 sm:mt-3 sm:border-0 sm:pb-0 sm:text-slate-600 ${showcase ? "text-sm" : "text-[10px] sm:text-xs"}`}>{product.store?.logo_url ? <CatalogImage src={normalizePublicAssetUrl(product.store.logo_url) || product.store.logo_url} alt="" width={20} height={20} loading="lazy" className="h-4 w-4 shrink-0 rounded-full object-cover sm:h-5 sm:w-5" /> : <StoreIcon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />}<span className={showcase ? "break-words" : "truncate"}>{storeName}</span></p>
      <div className="mt-auto pt-2 sm:mt-3 sm:border-t sm:border-slate-100 sm:pt-3">{isPlrMode ? <div className="space-y-1"><p className="hidden text-xs text-slate-600 sm:block">Produto final: <span className="font-semibold text-slate-800">{currency.format(standardPrice)}</span></p><p className="text-[13px] font-black text-blue-700 sm:text-sm sm:text-violet-800">{currency.format(plrPrice)} <span className="text-[9px] font-bold text-blue-600 sm:hidden">no PIX</span></p></div> : <div className="flex min-w-0 items-baseline justify-between gap-1 sm:block">{hasDiscount && <p className="order-2 shrink-0 text-[9px] font-medium text-slate-400 line-through sm:text-xs">{currency.format(originalPrice)}</p>}<p className={`min-w-0 ${showcase ? "text-lg" : "text-[13px] sm:text-lg"} font-black text-blue-700 ${hasDiscount ? 'sm:text-orange-700' : 'sm:text-slate-900'}`}>{isFree ? 'Grátis' : currency.format(standardPrice)}{!isFree && <span className="ml-1 text-[8px] font-bold sm:hidden">no PIX</span>}</p></div>}</div>
      <button onClick={handleAdd} className={`mt-2 inline-flex ${showcase ? "min-h-11" : "min-h-9"} w-full items-center justify-center gap-1 rounded-md bg-blue-700 px-1.5 text-[10px] font-black text-white shadow-sm transition-colors hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:hidden`} aria-label={isFree ? `Ver material gratuito: ${itemTitle}` : `Adicionar ao carrinho: ${itemTitle}`}><ShoppingBag aria-hidden="true" className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{isFree ? 'Ver grátis' : 'Adicionar Carrinho'}</span></button>
      <div className="mt-3 hidden grid-cols-[48px_minmax(0,1fr)] gap-2 sm:grid">
        <button onClick={handleAdd} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600" title={isFree ? 'Ver material gratuito' : 'Adicionar ao carrinho'} aria-label={isFree ? `Ver material gratuito: ${itemTitle}` : `Adicionar ao carrinho: ${itemTitle}`}><ShoppingBag aria-hidden="true" className="h-4 w-4" /></button>
        <button onClick={handleBuy} aria-label={isFree ? `Resgatar material: ${itemTitle}` : `Comprar ${isPlrMode ? 'licença PLR de ' : ''}${itemTitle}`} className="inline-flex min-h-11 min-w-0 items-center justify-center gap-1 rounded-xl bg-blue-700 px-3 text-xs font-bold text-white transition-colors hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">{isFree ? <Gift aria-hidden="true" className="h-4 w-4" /> : <Zap aria-hidden="true" className="h-4 w-4" />}<span className="truncate">{isFree ? 'Resgatar' : isPlrMode ? 'Comprar PLR' : 'Comprar'}</span></button>
      </div>
    </div>
  </article>;
}
