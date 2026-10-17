import type { Product, Store } from './types';
import { readableProductDescription } from './product-description';
import { SITE_URL } from './seo';
import { instagramBrandedCaption } from './instagram-design';

export type InstagramTarget = 'story' | 'feed';
export type InstagramPostStatus = 'awaiting_upload' | 'creating' | 'processing' | 'publishing' | 'published' | 'failed' | 'uncertain';
export const INSTAGRAM_FORMATS = {
  story: { width: 1080, height: 1920, label: 'Story · 9:16' },
  feed: { width: 1080, height: 1350, label: 'Feed · 4:5' },
} as const;
export const isInstagramUuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export function instagramProductLink(store: Pick<Store, 'slug'>, product: Pick<Product, 'id' | 'slug'>) {
  return `${SITE_URL}/loja/${encodeURIComponent(store.slug)}/produto/${encodeURIComponent(product.slug || product.id)}`;
}
export function instagramProductCaption(product: Pick<Product, 'id' | 'slug' | 'titulo' | 'descricao' | 'preco' | 'is_free'>, store: Pick<Store, 'slug' | 'nome_loja'>, options: { showPrice?: boolean } = {}) {
  const text = readableProductDescription(product.descricao || '').trim();
  const value = Number(product.preco);
  const price = product.is_free || value === 0 ? 'Gratuito' : Number.isFinite(value) && value > 0 ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Confira o preço na loja';
  const ending = [options.showPrice ? price : '', `Conheça o material na loja ${store.nome_loja}:`, instagramProductLink(store, product)].filter(Boolean).join('\n\n');
  const room = Math.max(0, Math.min(1400, 2120 - product.titulo.length - ending.length - 4));
  const excerpt = text.length > room ? text.slice(0, room).replace(/\s+\S*$/, '').trim() : text;
  return instagramBrandedCaption([product.titulo, excerpt, ending].filter(Boolean).join('\n\n'));
}
export type InstagramAccount = { username: string; account_type: string; expires_at: string; expired: boolean };
export type InstagramPost = { id: string; target: InstagramTarget; status: InstagramPostStatus; media_id: string | null; error_message: string | null; created_at: string };
export type InstagramSnapshot = { configured: boolean; migrationRequired: boolean; account: InstagramAccount | null; posts: InstagramPost[] };
