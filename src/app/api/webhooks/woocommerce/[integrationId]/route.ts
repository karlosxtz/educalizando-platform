import { archiveDeletedWooProduct,decryptWooSecret,hasWooProductMapping,importWooProduct,isRecentEducalizandoProductEcho,saveWooOrder,validWooSignature } from '@/lib/woocommerce-service';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(request: Request, { params }: { params: Promise<{ integrationId: string }> }) {
  try {
    const { integrationId } = await params; const raw = await request.text(); const signature = request.headers.get('x-wc-webhook-signature') || ''; const topic = request.headers.get('x-wc-webhook-topic') || 'unknown'; const deliveryId = request.headers.get('x-wc-webhook-delivery-id') || '';
    const { data: integration } = await supabaseAdmin.from('woocommerce_integrations').select('*').eq('id', integrationId).eq('status', 'active').maybeSingle(); if (!integration) return NextResponse.json({ error: 'Integração inexistente.' }, { status: 404 });
    if (!validWooSignature(raw, signature, decryptWooSecret(integration.webhook_secret_encrypted))) return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 401 });
    if (deliveryId) { const { error } = await supabaseAdmin.from('woocommerce_webhook_events').insert({ integration_id: integration.id, delivery_id: deliveryId, topic }); if (error?.code === '23505') return NextResponse.json({ success: true, duplicate: true }); if (error) throw error; }
    const payload = JSON.parse(raw);
    if (topic.startsWith('order.') && integration.sync_orders_from_woo) await saveWooOrder(integration, payload);
    const productEcho = topic.startsWith('product.') && await isRecentEducalizandoProductEcho(integration.id, Number(payload.id));
    const productMapped = topic.startsWith('product.') && await hasWooProductMapping(integration.id, Number(payload.id));
    if (topic === 'product.deleted' && integration.sync_products_from_woo && !productEcho) await archiveDeletedWooProduct(integration, Number(payload.id));
    else if (topic.startsWith('product.') && integration.sync_products_from_woo && !productEcho && productMapped) await importWooProduct(integration, payload);
    const productSkippedForReview = topic.startsWith('product.') && !productMapped;
    await supabaseAdmin.from('woocommerce_sync_logs').insert({ integration_id: integration.id, store_id: integration.store_id, direction: 'webhook', entity_type: topic.startsWith('order.') ? 'order' : 'product', status: 'success', processed_count: productEcho || productSkippedForReview ? 0 : 1, message: productEcho ? `Retorno ${topic} reconhecido e ignorado.` : productSkippedForReview ? `Evento ${topic} aguardando seleção na vistoria.` : `Evento ${topic} recebido.` });
    return NextResponse.json({ success: true });
  } catch (error) { console.error('[WooCommerce webhook]', error); return NextResponse.json({ error: 'Falha ao processar evento.' }, { status: 500 }); }
}
