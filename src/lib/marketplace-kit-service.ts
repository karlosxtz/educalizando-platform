import { supabaseAdmin } from '@/lib/supabase';
import type { Kit, Product, Store } from '@/lib/types';

export type MarketplaceKit = Kit & { store?: Store };

/** Public server query used by the marketplace. Combos are not products, so
 * they must never depend on the product-only search query to be displayed. */
export async function getPublicMarketplaceKits(limit = 24): Promise<MarketplaceKit[]> {
  const { data, error } = await supabaseAdmin
    .from('kits')
    .select('*, store:stores(*), kit_items(id, kit_id, product_id, products(*))')
    .eq('status', 'publicado')
    .is('excluido_em', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[marketplace kits]', error.message);
    return [];
  }

  return (data || []).map((kit: any) => ({
    ...kit,
    products: (kit.kit_items || [])
      .map((item: any) => item.products)
      .filter((product: Product | null) => product && product.status === 'publicado' && !product.excluido_em),
    items: kit.kit_items || [],
  })) as MarketplaceKit[];
}
