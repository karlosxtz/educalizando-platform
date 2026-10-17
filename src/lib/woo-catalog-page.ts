import 'server-only';
import { credentialsFromIntegration, wooRequest, type WooProduct } from './woocommerce-service';
import { supabaseAdmin as db } from './supabase';
export async function wooProductPage(integration: Parameters<typeof credentialsFromIntegration>[0], page: number, cutoff?: string, idsOnly = false) {
  const query = new URLSearchParams({ status: 'any', per_page: '50', page: String(page), orderby: 'id', order: 'asc', _fields: idsOnly ? 'id' : 'id,name,price,regular_price,status,images,stock_status,stock_quantity' });
  if (cutoff) { query.set('before', cutoff.replace(/\.\d{3}Z$/, '')); query.set('dates_are_gmt', 'true'); }
  let items: WooProduct[];
  try { items = await wooRequest<WooProduct[]>(credentialsFromIntegration(integration), 'products?' + query); }
  catch (error) { if ((error as { code?: string }).code === 'rest_post_invalid_page_number') return []; throw error; }
  if (!Array.isArray(items)) throw new Error('A loja retornou um catálogo em formato inválido. Confira a REST API do WooCommerce.');
  return items;
}
export async function wooReviewPage(integration: Parameters<typeof credentialsFromIntegration>[0], page: number) {
  const remote = await wooProductPage(integration, page);
  const { data, error } = remote.length ? await db.from('woocommerce_product_mappings').select('woo_product_id,product_id').eq('integration_id', integration.id).in('woo_product_id', remote.map(item => item.id)) : { data: [], error: null };
  if (error) throw error;
  const mapped = new Map((data || []).map(item => [Number(item.woo_product_id), item.product_id]));
  return { products: remote.map(item => ({ id: item.id, name: item.name, price: Number(item.price || item.regular_price || 0), status: item.status || 'draft', image: item.images?.[0]?.src || null, alreadyImported: mapped.has(item.id), localProductId: mapped.get(item.id) || null })), page, hasMore: remote.length === 50 };
}
