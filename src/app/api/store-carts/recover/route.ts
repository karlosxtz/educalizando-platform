import { supabaseAdmin as db } from '@/lib/supabase';
import { cartJson, cartUuid, cartOrigin, cartBody, resolveStoreCart } from '@/lib/store-cart-server';
import { consumeRequestRateLimit, rateLimitResponse } from '@/lib/request-rate-limit';
async function findCart(token: string) {
  const { data, error } = await db.from('store_cart_recovery').select('id,store_id,items,order_id,status').eq('recovery_token', token).eq('status', 'open').gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()).maybeSingle();
  if (error || !data) return null;
  if (data.order_id) { const { data: order } = await db.from('orders').select('status').eq('id', data.order_id).eq('store_id', data.store_id).maybeSingle(); if (order?.status === 'paid') return null; }
  return data;
}
export async function GET(request: Request) {
  try {
    const token = new URL(request.url).searchParams.get('token'); if (!cartUuid(token)) return cartJson({ error: 'Link de retomada inválido.' }, 400);
    const limit = await consumeRequestRateLimit(request, { namespace: 'store-cart-resume', limit: 60, windowMs: 60000 }); if (!limit.allowed) return rateLimitResponse(limit);
    const cart = await findCart(token); if (!cart) return cartJson({ error: 'Este carrinho já foi concluído, está vazio ou expirou.' }, 404);
    const { data: store } = await db.from('stores').select('id,slug,nome_loja').eq('id', cart.store_id).maybeSingle();
    if (!store) return cartJson({ error: 'Loja indisponível.' }, 404);
    const items = await resolveStoreCart(store.id, cart.items);
    if (!items.length) return cartJson({ error: 'Os materiais não estão mais disponíveis.' }, 404);
    return cartJson({ store, items, total: items.reduce((sum, item) => sum + item.price * item.quantity, 0) });
  } catch { return cartJson({ error: 'Os materiais ou preços mudaram. Acesse a loja e confira a disponibilidade.' }, 409); }
}
export async function POST(request: Request) {
  try {
    if (!cartOrigin(request)) return cartJson({ error: 'Origem inválida.' }, 403);
    const limit = await consumeRequestRateLimit(request, { namespace: 'store-cart-unsubscribe', limit: 20, windowMs: 60000 }); if (!limit.allowed) return rateLimitResponse(limit);
    const body = await cartBody(request); if (!cartUuid(body.token) || body.action !== 'unsubscribe') return cartJson({ error: 'Link inválido.' }, 400);
    const { error } = await db.from('store_cart_recovery').update({ phone: null, customer_name: null, consent_at: null, consent_text: null }).eq('recovery_token', body.token);
    if (error) throw error; return cartJson({ success: true });
  } catch { return cartJson({ error: 'Não foi possível cancelar agora. Tente novamente.' }, 503); }
}
