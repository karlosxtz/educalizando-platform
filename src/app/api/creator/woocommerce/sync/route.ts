import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { credentialsFromIntegration,importSelectedWooProducts,saveWooOrder,syncProductsToWoo,wooListAll } from '@/lib/woocommerce-service';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const user = await getRequestUser(request); if (!user) return NextResponse.json({ error: 'Faça login como criador.' }, { status: 401 });
    const { data: store } = await supabaseAdmin.from('stores').select('id').eq('creator_id', user.id).maybeSingle(); if (!store) return NextResponse.json({ error: 'Loja não encontrada.' }, { status: 404 });
    const { data: integration, error } = await supabaseAdmin.from('woocommerce_integrations').select('*').eq('store_id', store.id).maybeSingle(); if (error) throw error; if (!integration) return NextResponse.json({ error: 'Conecte uma loja WooCommerce primeiro.' }, { status: 409 });
    if (integration.status !== 'active') return NextResponse.json({ error: 'A integração está pausada.' }, { status: 409 });
    const { direction, productIds } = await request.json(); let result = { processed: 0, failed: 0 }; let entityType = 'product';
    if (direction === 'to_woo') result = await syncProductsToWoo(integration, new URL(request.url).origin);
    else if (direction === 'from_woo') {
      const selectedIds = Array.isArray(productIds) ? [...new Set(productIds.map(Number).filter(id => Number.isInteger(id) && id > 0))] : [];
      if (!selectedIds.length) return NextResponse.json({ error: 'Selecione pelo menos um produto para importar.' }, { status: 400 });
      if (selectedIds.length > 100) return NextResponse.json({ error: 'Importe no máximo 100 produtos por vez.' }, { status: 400 });
      result = await importSelectedWooProducts(integration, selectedIds);
    }
    else if (direction === 'orders') { entityType = 'order'; const orders = await wooListAll<any>(credentialsFromIntegration(integration), 'orders'); for (const order of orders) { try { await saveWooOrder(integration, order); result.processed++; } catch { result.failed++; } } }
    else return NextResponse.json({ error: 'Direção de sincronização inválida.' }, { status: 400 });
    const status = result.failed ? (result.processed ? 'partial' : 'error') : 'success'; const now = new Date().toISOString();
    await Promise.all([supabaseAdmin.from('woocommerce_sync_logs').insert({ integration_id: integration.id, store_id: store.id, direction: direction === 'orders' ? 'from_woo' : direction, entity_type: entityType, status, processed_count: result.processed, failed_count: result.failed, message: result.failed ? 'Alguns itens não puderam ser sincronizados.' : 'Sincronização concluída.' }), supabaseAdmin.from('woocommerce_integrations').update({ last_sync_at: now, last_error: result.failed ? `${result.failed} item(ns) com falha` : null, updated_at: now }).eq('id', integration.id)]);
    return NextResponse.json({ success: status !== 'error', ...result, status });
  } catch (error) { console.error('[WooCommerce sync]', error); return NextResponse.json({ error: error instanceof Error ? error.message : 'A sincronização falhou.' }, { status: 503 }); }
}
