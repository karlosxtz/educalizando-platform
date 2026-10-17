import { supabaseAdmin as db } from '@/lib/supabase';
import { publicSiteOrigin } from '@/lib/public-links';
import { cartJson, cartOwner, cartBody, cartOrigin, cartUuid } from '@/lib/store-cart-server';
import { consumeRequestRateLimit, rateLimitResponse } from '@/lib/request-rate-limit';
export async function GET(request: Request) {
  try {
    const store = await cartOwner(request); if (!store) return cartJson({ error: 'Entre com a conta do criador.' }, 401);
    const days = Number(new URL(request.url).searchParams.get('days') || 30); if (![7, 30, 90].includes(days)) return cartJson({ error: 'Período inválido.' }, 400);
    const { data, error } = await db.rpc('report_store_carts', { p_store: store.id, p_days: days });
    if (error) { if (['42P01', '42883', 'PGRST202', 'PGRST205'].includes(error.code)) return cartJson({ available: false, store }); throw error; }
    return cartJson({ available: true, store, ...data });
  } catch { return cartJson({ error: 'Não foi possível carregar os carrinhos. Tente novamente.' }, 503); }
}
export async function POST(request: Request) {
  try {
    if (!cartOrigin(request)) return cartJson({ error: 'Origem inválida.' }, 403);
    const store = await cartOwner(request); if (!store) return cartJson({ error: 'Entre com sua conta.' }, 401);
    const body = await cartBody(request); if (!cartUuid(body.id) || !['prepare', 'sent'].includes(body.action)) return cartJson({ error: 'Ação inválida.' }, 400);
    const limit = await consumeRequestRateLimit(request, { namespace: 'store-cart-reminder:' + store.id, limit: 10, windowMs: 60000 }); if (!limit.allowed) return rateLimitResponse(limit);
    const { data: cart, error } = await db.from('store_cart_recovery').select('id,items,phone,customer_name,consent_at,reminder_prepared_at,reminder_sent_at,order_id,recovery_token').eq('id', body.id).eq('store_id', store.id).eq('status', 'open').gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()).lte('updated_at', new Date(Date.now() - 20 * 60000).toISOString()).maybeSingle();
    if (error) throw error;
    if (!cart?.consent_at || !cart.phone || cart.reminder_sent_at) return cartJson({ error: 'Este carrinho não tem um lembrete autorizado disponível.' }, 409);
    if (cart.order_id) { const { data: order, error: orderError } = await db.from('orders').select('status').eq('id', cart.order_id).eq('store_id', store.id).maybeSingle(); if (orderError) throw orderError; if (order?.status === 'paid') return cartJson({ error: 'Esta compra já foi concluída.' }, 409); }
    if (body.action === 'sent' && !cart.reminder_prepared_at) return cartJson({ error: 'Prepare a mensagem antes de marcar o envio.' }, 409);
    const { data: updated, error: updateError } = await db.from('store_cart_recovery').update(body.action === 'prepare' ? { reminder_prepared_at: cart.reminder_prepared_at || new Date().toISOString() } : { reminder_sent_at: new Date().toISOString() }).eq('id', cart.id).eq('store_id', store.id).eq('status', 'open').not('consent_at', 'is', null).is('reminder_sent_at', null).select('id');
    if (updateError) throw updateError; if (!updated?.length) return cartJson({ error: 'O carrinho foi atualizado. Recarregue a lista.' }, 409);
    if (body.action === 'sent') return cartJson({ success: true });
    const names = (Array.isArray(cart.items) ? cart.items : []).slice(0, 2).map((item: { title: string }) => item.title).join(', ');
    const text = `Olá${cart.customer_name ? ', ' + cart.customer_name.split(' ')[0] : ''}! Aqui é da loja ${store.nome_loja}. Você autorizou um lembrete sobre seu carrinho${names ? ': ' + names : ''}.\n\nSe quiser retomar, confira os materiais e os preços atualizados neste link:\n${publicSiteOrigin()}/retomar-compra/${cart.recovery_token}\n\nVocê pode cancelar o lembrete pelo mesmo link.`;
    return cartJson({ message: text, whatsappUrl: 'https://wa.me/' + cart.phone + '?text=' + encodeURIComponent(text) });
  } catch { return cartJson({ error: 'Não foi possível preparar o lembrete. Tente novamente.' }, 503); }
}
