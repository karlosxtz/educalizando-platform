import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { isUuid } from '@/lib/conversion-events';

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Authorization, Cookie' } });
export async function GET(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return json({ error: 'Não autorizado.' }, 401);
  const params = new URL(request.url).searchParams;
  const storeId = params.get('storeId');
  if (!isUuid(storeId)) return json({ error: 'Loja inválida.' }, 400);
  const { data: store } = await supabaseAdmin.from('stores').select('id').eq('id', storeId).eq('creator_id', user.id).maybeSingle();
  if (!store) return json({ error: 'Loja não encontrada.' }, 403);
  const days = params.get('days') === '7' ? 7 : 30;
  const since = new Date(Date.now() - days * 86400000).toISOString();
  // Purge old anonymous rows whenever this store's creator opens the report.
  const cleanup = await supabaseAdmin.from('store_conversion_events').delete().eq('store_id', storeId).lt('created_at', new Date(Date.now() - 90 * 86400000).toISOString());
  if (cleanup.error) return json({ error: 'Ative a migration de lojas seguidas e conversão para usar este painel.' }, 503);
  const summary = await supabaseAdmin.rpc('store_conversion_summary', { p_store_id: storeId, p_since: since });
  if (summary.error) return json({ error: 'O resumo de conversão está indisponível. Tente novamente.' }, 503);
  const rows = new Map<string, { productId: string; title: string; slug: string | null; views: number; carts: number; checkouts: number; purchases: number }>();
  for (const item of summary.data || []) rows.set(item.product_id, { productId: item.product_id, title: 'Material da loja', slug: null, views: Number(item.views), carts: Number(item.carts), checkouts: Number(item.checkouts), purchases: 0 });
  // Purchases come only from paid orders, never a browser-supplied Purchase event.
  for (let offset = 0; ; offset += 500) {
    const result = await supabaseAdmin.from('orders').select('id,items:order_items(product_id,product_title)').eq('store_id', storeId).eq('status', 'paid')
      .or(`paid_at.gte.${since},and(paid_at.is.null,created_at.gte.${since})`).order('id').range(offset, offset + 499);
    if (result.error) return json({ error: 'Não foi possível conferir as compras confirmadas.' }, 503);
    for (const order of result.data || []) for (const item of new Map((order.items || []).filter(item => item.product_id).map(item => [item.product_id, item])).values()) {
      const id = item.product_id!;
      const row = rows.get(id) || { productId: id, title: item.product_title || 'Material da loja', slug: null, views: 0, carts: 0, checkouts: 0, purchases: 0 };
      row.purchases++; rows.set(id, row);
    }
    if ((result.data?.length || 0) < 500) break;
  }
  const ids = [...rows.keys()];
  for (let offset = 0; offset < ids.length; offset += 100) {
    const result = await supabaseAdmin.from('products').select('id,titulo,slug').eq('store_id', storeId).in('id', ids.slice(offset, offset + 100));
    if (result.error) return json({ error: 'Não foi possível identificar os materiais.' }, 503);
    for (const product of result.data || []) Object.assign(rows.get(product.id)!, { title: product.titulo, slug: product.slug });
  }
  return json({ days, since, products: [...rows.values()].sort((a, b) => b.views - a.views || b.purchases - a.purchases) });
}
