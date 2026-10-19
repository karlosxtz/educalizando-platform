'use client';
import Link from '@/components/OnDemandLink';
import StoreVideoCover from '@/components/store/StoreVideoCover';
import FavoriteProductButton from '@/components/FavoriteProductButton';
import ProductEducationBadges from '@/components/store/ProductEducationBadges';
import { useCart } from '@/components/store/CartContext';
import { ArrowUpRight, BookOpen, ShoppingBag, Star } from 'lucide-react';
import { readableProductDescription } from '@/lib/product-description';
import type { Category, EducationLevel, Store, StoreListingProduct } from '@/lib/types';
import styles from './StorefrontTheme.module.css';

export function storefrontProductHref(store: Pick<Store, 'slug'>, product: Pick<StoreListingProduct, 'id' | 'slug' | 'listing_mode'>) {
  return `/loja/${encodeURIComponent(store.slug)}/produto/${encodeURIComponent(product.slug || product.id)}` + (product.listing_mode === 'plr' ? '?licenca=plr' : '');
}
export function storefrontPrice(value: number) { return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
export default function StorefrontProductCard({ store, product, categories, levels }: { store: Store; product: StoreListingProduct; categories: Category[]; levels: EducationLevel[] }) {
  const { addToCart } = useCart();
  const href = storefrontProductHref(store, product), plr = product.listing_mode === 'plr';
  const free = !plr && (product.is_free || Number(product.preco) === 0);
  const validPrice = Number.isFinite(Number(product.preco)) && Number(product.preco) >= 0;
  const category = categories.find(item => item.id === product.category_id)?.nome;
  return <article className={styles.card + ' relative'} data-product-id={product.id} data-offer={plr ? 'plr' : 'standard'}>
    <div className="absolute right-2 top-2 z-20"><FavoriteProductButton productId={product.id} title={product.titulo} compact /></div>
    <Link href={href} className={styles.cover} aria-label={'Ver ' + product.titulo}>
      {product.capa_url ? <StoreVideoCover product={product} className="h-full w-full object-contain" /> : <BookOpen aria-hidden="true" />}
      <span className={styles.format}>{plr ? 'Licença PLR' : product.tipo}</span>
    </Link>
    <div className={styles.cardBody}>
      <div className={styles.badges}>{category && <span className={styles.category}>{category}</span>}<ProductEducationBadges product={product} levels={levels} /></div>
      <Link href={href}><h3 className={styles.cardTitle}>{product.titulo}</h3></Link>
      {(plr ? product.plr_descricao || product.descricao : product.descricao) && <p className={styles.cardDescription}>{readableProductDescription((plr ? product.plr_descricao || product.descricao : product.descricao) || '')}</p>}
      {Number(product.review_count) > 0 && Number(product.average_rating) > 0 && <p className={styles.rating}><Star aria-hidden="true" className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />{product.average_rating} · {product.review_count} {product.review_count === 1 ? 'avaliação' : 'avaliações'}</p>}
      <div className={styles.cardBottom}><p className={styles.muted}>{plr ? 'Licença para revenda' : 'Material digital'}</p><p className={styles.price}>{free ? 'Gratuito' : validPrice ? storefrontPrice(product.preco) : 'Confira o valor'}</p>
        <div className={styles.actions}>
          {free || !validPrice ? <Link href={href} className={styles.details}>{free ? 'Acessar material' : 'Ver material'}</Link> : <button type="button" className={styles.details} aria-label={'Adicionar ' + product.titulo + ' ao carrinho'} onClick={() => addToCart({ productId: product.id, title: product.titulo, price: product.preco, isPlr: plr, storeId: store.id, type: product.tipo, imageUrl: product.capa_url || undefined, quantity: 1 })}><ShoppingBag aria-hidden="true" className="h-4 w-4 shrink-0" /><span>Adicionar</span></button>}
          <Link href={href} className={styles.cartButton} aria-label={'Ver detalhes de ' + product.titulo}><ArrowUpRight aria-hidden="true" className="h-5 w-5" /></Link>
        </div>
      </div>
    </div>
  </article>;
}
