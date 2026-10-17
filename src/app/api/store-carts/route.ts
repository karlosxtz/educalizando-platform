import { supabaseAdmin as db } from '@/lib/supabase';
import { cartBody, cartJson, cartOrigin, cartUuid, resolveStoreCart } from '@/lib/store-cart-server';
import { normalizeWhatsAppNumber } from '@/lib/whatsapp-notification-service';
import { consumeRequestRateLimit, rateLimitResponse } from '@/lib/request-rate-limit';
export async function POST(request: Request) {
  try {
    if (!cartOrigin(request)) return cartJson({ saved: false }, 403);
    const body = await cartBody(request);
    if (body.source !== 'store' || !cartUuid(body.storeId) || !cartUuid(body.browserToken) || !['cart', 'checkout'].includes(body.stage) || (body.consent !== undefined && typeof body.consent !== 'boolean')) return cartJson({ saved: false }, 400);
    const { data: store, error: storeError } = await db.from('stores').select('id,slug').eq('id', body.storeId).maybeSingle();
    if (storeError) throw storeError; if (!store) return cartJson({ saved: false }, 404);
    const ref = new URL(request.headers.get('referer') || 'https://invalid.local');
    const prefix = '/loja/' + encodeURIComponent(store.slug);
    if (ref.origin !== new URL(request.url).origin || !(ref.pathname === prefix || ref.pathname.startsWith(prefix + '/')) || ref.searchParams.get('origem') === 'marketplace') return cartJson({ saved: false }, 403);
    const limit = await consumeRequestRateLimit(request, { namespace: 'store-cart-recovery', limit: 60, windowMs: 60000 }); if (!limit.allowed) return rateLimitResponse(limit);
    const items = await resolveStoreCart(store.id, body.items);
    let contact = null;
    if (typeof body.consent === 'boolean') {
      const phone = body.consent ? normalizeWhatsAppNumber(body.phone) : null;
      if (body.consent && !phone) return cartJson({ saved: false, error: 'Informe um WhatsApp válido para autorizar o lembrete.' }, 400);
      contact = { consent: body.consent, phone, name: body.consent && typeof body.name === 'string' ? body.name.trim().slice(0, 120) : null };
    }
    const { data, error } = await db.rpc('save_store_cart', { p_store: store.id, p_browser: body.browserToken, p_items: items, p_total: Math.round(items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100, p_stage: body.stage, p_contact: contact, p_parent: cartUuid(body.parentToken) ? body.parentToken : null });
    if (error) return cartJson({ saved: false }, 202);
    if (data === 'rotate') return cartJson({ saved: false, newCartRequired: true }, 409);
    return cartJson({ saved: true });
  } catch { return cartJson({ saved: false }, 400); }
}
