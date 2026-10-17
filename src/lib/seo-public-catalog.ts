import 'server-only';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { supabase as db } from './supabase';
import { collectSitemapRows } from './sitemap-pagination';
import { buildSeoIndexPolicy } from './seo-index-policy';
import type { Product } from './types';

// Only public RLS reads, cached for five minutes. A failed read throws instead of
// caching a false empty catalogue and accidentally deindexing the whole site.
const readRows = unstable_cache(async () => {
  const [products, stores, categories] = await Promise.all([
    collectSitemapRows((from, to) => db.from('products').select('id,store_id,slug,capa_url,category_id,category_ids,education_level_id,education_level_ids,created_at,updated_at').in('status', ['publicado', 'ativo', 'published']).is('excluido_em', null).order('id').range(from, to)),
    collectSitemapRows((from, to) => db.from('stores').select('id,nome_loja,slug,created_at,updated_at').neq('slug', 'eduardoadmin').order('id').range(from, to)),
    collectSitemapRows((from, to) => db.from('categories').select('id,nome,slug,created_at').is('store_id', null).order('id').range(from, to)),
  ]);
  return { products, stores, categories };
}, ['seo-public-catalog-quality-v1'], { revalidate: 3600, tags: ['public-catalog'] });

export const readSeoPublicCatalog = cache(async () => {
  const rows = await readRows();
  return { ...rows, ...buildSeoIndexPolicy(rows.products, rows.stores, rows.categories) };
});

export const readSeoCategoryProducts = cache(async (slug: string) => {
  const catalog = await readSeoPublicCatalog();
  const rule = catalog.categoryRules.get(slug);
  if (!rule || !catalog.stores.length) return [];
  // Include every global category record behind the same slug and its aliases.
  // The product records themselves are never reclassified or edited.
  const ids = rule.categoryIds.join(',');
  const { data, error } = await db.from('products')
    .select('id,store_id,titulo,slug,descricao,tipo,preco,preco_original,is_free,is_plr,preco_plr,has_plr_delivery,capa_url,status,created_at,category_id,category_ids,education_level_id,education_level_ids,age_range,format_details,page_count,tags,store:store_id(id,nome_loja,slug,logo_url)')
    .in('status', ['publicado', 'ativo', 'published']).is('excluido_em', null)
    .in('store_id', catalog.stores.map(s => s.id))
    .or(`category_id.in.(${ids}),category_ids.ov.{${ids}}`)
    .order('created_at', { ascending: false }).order('id').limit(24);
  if (error) throw error;
  return (data || []) as unknown as Product[];
});
