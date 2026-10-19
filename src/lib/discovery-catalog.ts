import { cache } from 'react';
import { supabase } from './supabase';
import { homepageProduct } from './homepage-presentation';
import { productPresentationVideo } from './presentation-video';
import type { Product, Store } from './types';

export const DISCOVERY_PAGE_SIZE = 24;
export type DiscoveryProduct = Product & { store?: Store };
export function discoveryFilters(params: Record<string, string | string[] | undefined>) {
  const text = (key: string) => typeof params[key] === 'string' ? params[key] as string : '';
  return { q: text('q').trim().slice(0, 100), category: /^[a-f0-9-]{36}$/i.test(text('categoria')) ? text('categoria') : '', page: Math.min(10000, Math.max(1, Number.parseInt(text('pagina'), 10) || 1)) };
}
export const readDiscoveryProducts = cache(async (videosOnly: boolean, q: string, category: string, page: number) => {
  try {
    let query = supabase.from('products').select('id,store_id,titulo,slug,tipo,preco,preco_original,is_free,is_plr,preco_plr,has_plr_delivery,capa_url,status,created_at,category_id,instagram_video_url,presentation_video_url,video_as_cover,store:stores!products_store_id_fkey(id,nome_loja,slug,logo_url)', { count: 'exact' })
      .eq('status', 'publicado').is('excluido_em', null);
    if (videosOnly) query = query.or('presentation_video_url.not.is.null,instagram_video_url.not.is.null');
    if (q) query = query.ilike('titulo', `%${q.replace(/[%_]/g, ' ')}%`);
    if (category) query = query.eq('category_id', category);
    const { data, count, error } = await query.order('created_at', { ascending: false }).order('id').range((page - 1) * DISCOVERY_PAGE_SIZE, page * DISCOVERY_PAGE_SIZE - 1);
    if (error) return { products: [] as DiscoveryProduct[], total: 0, unavailable: true };
    const products = (data as unknown as DiscoveryProduct[] || []).filter(product => !videosOnly || productPresentationVideo(product)).map(homepageProduct);
    return { products, total: count || 0, unavailable: false };
  } catch { return { products: [] as DiscoveryProduct[], total: 0, unavailable: true }; }
});
