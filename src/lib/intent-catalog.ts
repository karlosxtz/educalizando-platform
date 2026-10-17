import 'server-only';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { supabase } from './supabase';
import { selectIntentProducts } from './intent-product-selection';
import type { Product, Store } from './types';

// One shared, bounded public read instead of loading/searching 500 rows per topic.
// No delivery URL, buyer information or privileged client enters this cache.
const readCandidates = unstable_cache(async () => {
  const { data, error } = await supabase.from('products')
    .select('id,store_id,titulo,slug,descricao,tipo,preco,preco_original,is_free,is_plr,preco_plr,has_plr_delivery,capa_url,status,excluido_em,created_at,tags,format_details,views_count,category:category_id(id,nome,slug),education_level:education_level_id(id,nome,slug),store:store_id(id,nome_loja,slug,logo_url)')
    .eq('status', 'publicado').is('excluido_em', null)
    .order('created_at', { ascending: false }).order('id').limit(500);
  if (error) throw error; // Never cache an outage as an empty catalogue.
  return (data || []).map(product => ({ ...product, arquivo_url: null })) as unknown as (Product & { store?: Store })[];
}, ['intent-public-candidates-v1'], { revalidate: 3600, tags: ['public-catalog'] });

const readPublicIntentCandidates = cache(readCandidates);
export async function readIntentProducts(slug: string) {
  return selectIntentProducts(await readPublicIntentCandidates(), slug);
}
