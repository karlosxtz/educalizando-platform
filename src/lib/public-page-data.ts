import { cache } from 'react';
import { getStoreBySlug, getStoreById, getProductById, getPublicProductsByStoreId } from './store-service';
import { getCategories } from './category-service';
import { supabase } from './supabase';
import type { Product } from './types';

// Request-scoped deduplication: metadata and rendering share reads, never user sessions.
export const readPublicStore = cache(getStoreBySlug);
export const readPublicStoreById = cache(getStoreById);
export const readPublicProduct = cache(getProductById);
export const readPublicStoreProducts = cache(getPublicProductsByStoreId);
export const readPublicStoreCategories = cache(getCategories);

export const readPublicRelatedProducts = cache(async (storeId: string, productId: string): Promise<Product[]> => {
  const { data, error } = await supabase.from('products')
    .select('id,store_id,titulo,slug,tipo,preco,preco_original,capa_url,status,created_at,is_free,is_plr,preco_plr,has_plr_delivery,category_id,category_ids,education_level_id,education_level_ids')
    .eq('store_id', storeId).neq('id', productId).in('status', ['publicado', 'ativo', 'published'])
    .is('excluido_em', null).order('created_at', { ascending: false }).limit(16);
  return error ? [] : (data || []).map(item => ({ ...item, descricao: null, arquivo_url: null })) as Product[];
});
