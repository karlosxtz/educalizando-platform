import { randomBytes } from 'node:crypto';
import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { credentialsFromIntegration,encryptWooSecret,normalizeWooUrl,testWooConnection,wooRequest } from '@/lib/woocommerce-service';
import { NextResponse } from 'next/server';

async function context(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return null;
  const { data: store, error } = await supabaseAdmin.from('stores').select('id,creator_id,nome_loja').eq('creator_id', user.id).maybeSingle();
  if (error) throw error;
  return store ? { user, store } : null;
}

export async function GET(request: Request) {
  try {
    const ctx = await context(request); if (!ctx) return NextResponse.json({ error: 'Faça login como criador.' }, { status: 401 });
    const [{ data: integration, error }, { data: logs }, { data: orders, count: orderCount }] = await Promise.all([
      supabaseAdmin.from('woocommerce_integrations').select('id,site_url,status,sync_products_to_woo,sync_products_from_woo,sync_orders_from_woo,last_sync_at,last_error,created_at,updated_at').eq('store_id', ctx.store.id).maybeSingle(),
      supabaseAdmin.from('woocommerce_sync_logs').select('id,direction,entity_type,status,processed_count,failed_count,message,created_at').eq('store_id', ctx.store.id).order('created_at', { ascending: false }).limit(10),
      supabaseAdmin.from('woocommerce_orders').select('id,woo_order_id,status,currency,total,customer_name,customer_email,date_created', { count: 'exact' }).eq('store_id', ctx.store.id).order('date_created', { ascending: false, nullsFirst: false }).limit(10),
    ]);
    if (error) throw error;
    return NextResponse.json({ store: ctx.store, integration, logs: logs || [], orders: orders || [], orderCount: orderCount || 0 }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { console.error('[WooCommerce GET]', error); return NextResponse.json({ error: 'Não foi possível carregar a integração.' }, { status: 503 }); }
}

export async function POST(request: Request) {
  try {
    const ctx = await context(request); if (!ctx) return NextResponse.json({ error: 'Faça login como criador.' }, { status: 401 });
    const body = await request.json();
    const siteUrl = await normalizeWooUrl(String(body.siteUrl || ''));
    const consumerKey = String(body.consumerKey || '').trim(); const consumerSecret = String(body.consumerSecret || '').trim();
    if (!/^ck_[a-z0-9]{20,}$/i.test(consumerKey) || !/^cs_[a-z0-9]{20,}$/i.test(consumerSecret)) return NextResponse.json({ error: 'Informe as chaves Consumer Key e Consumer Secret válidas.' }, { status: 400 });
    await testWooConnection({ siteUrl, consumerKey, consumerSecret });
    const { data: previousIntegration } = await supabaseAdmin.from('woocommerce_integrations').select('*').eq('store_id', ctx.store.id).maybeSingle();
    if (previousIntegration) {
      const oldWebhookIds = Object.values(previousIntegration.webhook_ids || {}).filter((id): id is number => typeof id === 'number');
      for (const webhookId of oldWebhookIds) {
        try { await wooRequest(credentialsFromIntegration(previousIntegration), `webhooks/${webhookId}?force=true`, { method: 'DELETE' }); } catch (error) { console.error(`[WooCommerce replace webhook ${webhookId}]`, error); }
      }
    }
    const webhookSecret = randomBytes(32).toString('hex');
    const now = new Date().toISOString();
    const { data: integration, error } = await supabaseAdmin.from('woocommerce_integrations').upsert({ store_id: ctx.store.id, creator_id: ctx.user.id, site_url: siteUrl, consumer_key_encrypted: encryptWooSecret(consumerKey), consumer_secret_encrypted: encryptWooSecret(consumerSecret), webhook_secret_encrypted: encryptWooSecret(webhookSecret), status: 'active', last_error: null, updated_at: now }, { onConflict: 'store_id' }).select('id').single();
    if (error) throw error;
    const deliveryUrl = `${new URL(request.url).origin}/api/webhooks/woocommerce/${integration.id}`;
    const webhookIds: Record<string, number> = {};
    for (const topic of ['product.created', 'product.updated', 'product.deleted', 'order.created', 'order.updated']) {
      try { const webhook = await wooRequest<{ id: number }>({ siteUrl, consumerKey, consumerSecret }, 'webhooks', { method: 'POST', body: JSON.stringify({ name: `Educalizando — ${topic}`, topic, delivery_url: deliveryUrl, secret: webhookSecret, status: 'active' }) }); webhookIds[topic] = webhook.id; } catch (webhookError) { console.error(`[WooCommerce webhook ${topic}]`, webhookError); }
    }
    await supabaseAdmin.from('woocommerce_integrations').update({ webhook_ids: webhookIds, updated_at: now }).eq('id', integration.id);
    await supabaseAdmin.from('woocommerce_sync_logs').insert({ integration_id: integration.id, store_id: ctx.store.id, direction: 'to_woo', entity_type: 'connection', status: 'success', processed_count: 1, message: 'Loja conectada e webhooks configurados.' });
    return NextResponse.json({ success: true, integrationId: integration.id, webhooksConfigured: Object.keys(webhookIds).length });
  } catch (error) { console.error('[WooCommerce connect]', error); return NextResponse.json({ error: error instanceof Error ? error.message : 'Não foi possível conectar a loja.' }, { status: 400 }); }
}

export async function PATCH(request: Request) {
  try {
    const ctx = await context(request); if (!ctx) return NextResponse.json({ error: 'Faça login como criador.' }, { status: 401 });
    const body = await request.json(); const allowed: Record<string, boolean | string> = {};
    for (const field of ['sync_products_to_woo','sync_products_from_woo','sync_orders_from_woo']) if (field in body) allowed[field] = Boolean(body[field]);
    if ('status' in body && ['active','paused'].includes(body.status)) allowed.status = body.status;
    const { error } = await supabaseAdmin.from('woocommerce_integrations').update({ ...allowed, updated_at: new Date().toISOString() }).eq('store_id', ctx.store.id); if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) { console.error('[WooCommerce settings]', error); return NextResponse.json({ error: 'Não foi possível salvar as opções.' }, { status: 503 }); }
}

export async function DELETE(request: Request) {
  try {
    const ctx = await context(request); if (!ctx) return NextResponse.json({ error: 'Faça login como criador.' }, { status: 401 });
    const { data: integration } = await supabaseAdmin.from('woocommerce_integrations').select('*').eq('store_id', ctx.store.id).maybeSingle();
    if (integration) {
      const webhookIds = Object.values(integration.webhook_ids || {}).filter((id): id is number => typeof id === 'number');
      for (const webhookId of webhookIds) {
        try { await wooRequest(credentialsFromIntegration(integration), `webhooks/${webhookId}?force=true`, { method: 'DELETE' }); } catch (error) { console.error(`[WooCommerce remove webhook ${webhookId}]`, error); }
      }
    }
    const { error } = await supabaseAdmin.from('woocommerce_integrations').delete().eq('store_id', ctx.store.id); if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) { console.error('[WooCommerce disconnect]', error); return NextResponse.json({ error: 'Não foi possível desconectar agora.' }, { status: 503 }); }
}
