import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autenticação ausente.' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: userData } = await supabase.auth.getUser(token);
    
    if (!userData?.user) {
      return NextResponse.json({ error: 'Token inválido ou expirado.' }, { status: 401 });
    }

    const userId = userData.user.id;

    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    // Buscar transações da carteira (comissões e seus estornos) que pertencem a este usuário
    let txQuery = supabaseAdmin
      .from('wallet_transactions')
      .select('*, store:stores(nome_loja)')
      .eq('creator_id', userId)
      .in('type', ['AFFILIATE_COMMISSION', 'REFUND'])
      .order('created_at', { ascending: false });

    if (startDate) txQuery = txQuery.gte('created_at', startDate);
    if (endDate) txQuery = txQuery.lte('created_at', endDate);

    const { data: transactions, error } = await txQuery;

    if (error) {
      console.error('[API Affiliates Stats] Erro ao buscar transações:', error);
      return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 });
    }

    let totalComissoes = 0;
    let totalVendas = 0;
    let pendente = 0;
    let pago = 0;

    const validTransactions = transactions || [];

    // Map store comissoes
    const storeCommissions: Record<string, number> = {};

    validTransactions.forEach(tx => {
      // O netAmount é o valor final líquido recebido da comissão (seja + ou -)
      const amount = tx.net_amount || tx.gross_amount;
      if (tx.status === 'COMPLETED') {
        totalComissoes += amount;
        pago += amount;
        if (tx.store_id) {
          storeCommissions[tx.store_id] = (storeCommissions[tx.store_id] || 0) + amount;
        }
      } else if (tx.status === 'PENDING') {
        pendente += amount;
      }
    });

    let totalCliques = 0;
    let receitaGerada = 0;
    
    let storePerformanceData: any[] = [];
    let productPerformanceData: any[] = [];

    const { data: userAffiliates } = await supabaseAdmin
      .from('affiliates')
      .select('id, store_id, product_id, store:stores(id, nome_loja)')
      .eq('user_id', userId);

    if (userAffiliates && userAffiliates.length > 0) {
      const affiliateIds = userAffiliates.map(a => a.id);
      
      // 1. Cliques
      let clicksQuery = supabaseAdmin
        .from('affiliate_clicks')
        .select('store_id, product_id')
        .in('affiliate_id', affiliateIds);
        
      if (startDate) clicksQuery = clicksQuery.gte('created_at', startDate);
      if (endDate) clicksQuery = clicksQuery.lte('created_at', endDate);

      const { data: clicksData } = await clicksQuery;
      
      const clicksByStore: Record<string, number> = {};
      const clicksByProduct: Record<string, number> = {};

      if (clicksData) {
        totalCliques = clicksData.length;
        clicksData.forEach(c => {
          if (c.store_id) clicksByStore[c.store_id] = (clicksByStore[c.store_id] || 0) + 1;
          if (c.product_id) clicksByProduct[c.product_id] = (clicksByProduct[c.product_id] || 0) + 1;
        });
      }

      // 2. Vendas Pagas (Pedidos reais concluídos)
      let ordersQuery = supabaseAdmin
        .from('orders')
        .select('id, store_id, total_amount')
        .in('affiliate_id', affiliateIds)
        .eq('status', 'paid');
        
      if (startDate) ordersQuery = ordersQuery.gte('created_at', startDate);
      if (endDate) ordersQuery = ordersQuery.lte('created_at', endDate);

      const { data: validOrders } = await ordersQuery;
        
      const salesByStore: Record<string, { vendas: number, receita: number }> = {};
      
      if (validOrders && validOrders.length > 0) {
        totalVendas = validOrders.length;
        validOrders.forEach(order => {
          const amount = Number(order.total_amount || 0);
          receitaGerada += amount;
          
          if (order.store_id) {
            if (!salesByStore[order.store_id]) salesByStore[order.store_id] = { vendas: 0, receita: 0 };
            salesByStore[order.store_id].vendas += 1;
            salesByStore[order.store_id].receita += amount;
          }
        });
        
        // Product sales via order_items
        const orderIds = validOrders.map(o => o.id);
        const { data: orderItems } = await supabaseAdmin
          .from('order_items')
          .select('product_id, product_title, quantity, subtotal_amount, store_id')
          .in('order_id', orderIds);
          
        if (orderItems && orderItems.length > 0) {
          const prodPerfMap: Record<string, any> = {};
          
          orderItems.forEach(item => {
            if (!item.product_id) return;
            if (!prodPerfMap[item.product_id]) {
              const storeInfo = userAffiliates.find(a => a.store_id === item.store_id)?.store as any;
              prodPerfMap[item.product_id] = {
                productId: item.product_id,
                productName: item.product_title || 'Produto Desconhecido',
                storeName: storeInfo?.nome_loja || 'Loja Desconhecida',
                vendas: 0,
                receita: 0,
                cliques: clicksByProduct[item.product_id] || 0
              };
            }
            prodPerfMap[item.product_id].vendas += Number(item.quantity || 1);
            prodPerfMap[item.product_id].receita += Number(item.subtotal_amount || 0);
          });
          
          productPerformanceData = Object.values(prodPerfMap);
        }
      }
      
      // Build storePerformanceData
      const uniqueStoresMap = new Map();
      userAffiliates.forEach(a => {
        if (a.store && !uniqueStoresMap.has(a.store_id)) {
          uniqueStoresMap.set(a.store_id, a.store);
        }
      });
      
      for (const [storeId, storeObj] of uniqueStoresMap.entries()) {
        const cliques = clicksByStore[storeId] || 0;
        const vendas = salesByStore[storeId]?.vendas || 0;
        const receita = salesByStore[storeId]?.receita || 0;
        const comissao = storeCommissions[storeId] || 0;
        const conversao = cliques > 0 ? (vendas / cliques) * 100 : 0;
        
        // Only include stores that have some activity or affiliation
        storePerformanceData.push({
          storeId: storeId,
          storeName: storeObj.nome_loja || 'Desconhecida',
          cliques,
          vendas,
          receita,
          comissao,
          conversao
        });
      }
    }

    const conversao = totalCliques > 0 ? (totalVendas / totalCliques) * 100 : 0;
    const ticketMedio = totalVendas > 0 ? receitaGerada / totalVendas : 0;

    // sort arrays
    storePerformanceData.sort((a, b) => b.comissao - a.comissao || b.vendas - a.vendas);
    productPerformanceData.sort((a, b) => b.vendas - a.vendas || b.cliques - a.cliques);

    return NextResponse.json({
      success: true,
      stats: {
        totalComissoes,
        totalVendas,
        pendente,
        pago,
        cliques: totalCliques,
        receitaGerada,
        conversao,
        ticketMedio
      },
      storePerformance: storePerformanceData,
      productPerformance: productPerformanceData,
      recentTransactions: validTransactions.slice(0, 50).map(t => ({
        id: t.id,
        date: t.created_at,
        productName: t.product_title || 'Produto Digital',
        storeName: (t.store as any)?.nome_loja || 'Loja Desconhecida',
        orderId: t.order_id,
        type: t.type,
        amount: t.net_amount || t.gross_amount,
        status: t.status
      }))
    });

  } catch (error) {
    console.error('[API Affiliates Stats] Erro interno:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
