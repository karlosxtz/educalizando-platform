import { NextResponse } from 'next/server';
import { supabaseAdmin, isRealSupabaseConfigured } from '@/lib/supabase';

/**
 * API de Debug Financeiro
 * Mostra TODOS os dados relevantes para diagnosticar por que o painel do criador
 * não exibe os valores das vendas.
 * 
 * GET /api/admin/debug-wallet?storeId=xxx
 */
export async function GET(request: Request) {
  try {
    if (!isRealSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 500 });
    }

    const url = new URL(request.url);
    const storeIdParam = url.searchParams.get('storeId');

    // 1. Listar TODAS as lojas
    const { data: allStores, error: storesErr } = await supabaseAdmin
      .from('stores')
      .select('id, creator_id, nome_loja, slug');

    // 2. Listar TODAS as orders (últimas 50)
    const { data: allOrders, error: ordersErr } = await supabaseAdmin
      .from('orders')
      .select('id, store_id, status, total_amount, creator_net_amount, asaas_fee_amount, buyer_email, buyer_name, payment_method, asaas_payment_id, created_at, paid_at')
      .order('created_at', { ascending: false })
      .limit(50);

    // 3. Listar TODAS as wallet_transactions (últimas 50)
    const { data: allTx, error: txErr } = await supabaseAdmin
      .from('wallet_transactions')
      .select('id, store_id, order_id, type, status, gross_amount, net_amount, description, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    // 4. Se um storeId foi informado, buscar dados específicos
    let storeSpecific = null;
    if (storeIdParam) {
      const { data: storeOrders } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('store_id', storeIdParam);

      const { data: storeTx } = await supabaseAdmin
        .from('wallet_transactions')
        .select('*')
        .eq('store_id', storeIdParam);

      storeSpecific = {
        storeId: storeIdParam,
        ordersCount: storeOrders?.length || 0,
        orders: storeOrders,
        txCount: storeTx?.length || 0,
        transactions: storeTx
      };
    }

    // 5. Verificar store_ids distintos usados nos orders vs stores
    const orderStoreIds = [...new Set((allOrders || []).map((o: any) => o.store_id))];
    const storeIds = (allStores || []).map((s: any) => ({ id: s.id, slug: s.slug, nome: s.nome_loja }));

    // 6. Verificar se algum order.store_id NÃO existe em stores.id
    const storeIdSet = new Set((allStores || []).map((s: any) => s.id));
    const orphanOrderStoreIds = orderStoreIds.filter(sid => !storeIdSet.has(sid));

    return NextResponse.json({
      stores: {
        count: allStores?.length || 0,
        list: storeIds,
        error: storesErr?.message
      },
      orders: {
        count: allOrders?.length || 0,
        storeIdsUsed: orderStoreIds,
        orphanStoreIds: orphanOrderStoreIds,
        list: allOrders,
        error: ordersErr?.message
      },
      walletTransactions: {
        count: allTx?.length || 0,
        list: allTx,
        error: txErr?.message
      },
      storeSpecific,
      diagnosis: {
        hasOrphanStoreIds: orphanOrderStoreIds.length > 0,
        message: orphanOrderStoreIds.length > 0
          ? `PROBLEMA ENCONTRADO: ${orphanOrderStoreIds.length} store_id(s) nos orders NÃO correspondem a nenhuma loja registrada: [${orphanOrderStoreIds.join(', ')}]. Os orders usam um store_id diferente do id real da loja no Supabase.`
          : 'Todos os store_ids dos orders correspondem a lojas existentes.'
      }
    });

  } catch (err: any) {
    console.error('[Debug Wallet Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
