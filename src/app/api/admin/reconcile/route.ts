import { NextResponse } from 'next/server';
import { supabaseAdmin, isRealSupabaseConfigured } from '@/lib/supabase';
import { calculateOrderFinancials, estimateAsaasFee } from '@/lib/order-service';

/**
 * API de Reconciliação Financeira — Força Bruta
 * Busca TODAS as orders com status 'paid' no Supabase e garante que cada uma
 * tenha uma wallet_transaction SALE correspondente.
 * Se não tiver, cria a transação faltante.
 * 
 * GET /api/admin/reconcile
 */
export async function GET(request: Request) {
  try {
    if (!isRealSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 500 });
    }

    // 1. Buscar TODAS as orders com status = 'paid'
    const { data: paidOrders, error: ordersErr } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('status', 'paid');

    if (ordersErr) {
      console.error('[Reconcile] Erro ao buscar orders:', ordersErr);
      return NextResponse.json({ error: ordersErr.message }, { status: 500 });
    }

    if (!paidOrders || paidOrders.length === 0) {
      return NextResponse.json({ 
        message: 'Nenhuma order com status paid encontrada no banco.', 
        reconciled: 0,
        totalPaidOrders: 0
      });
    }

    // 2. Buscar TODAS as wallet_transactions do tipo SALE
    const { data: existingTxs, error: txErr } = await supabaseAdmin
      .from('wallet_transactions')
      .select('order_id')
      .eq('type', 'SALE');

    if (txErr) {
      console.error('[Reconcile] Erro ao buscar wallet_transactions:', txErr);
      return NextResponse.json({ error: txErr.message }, { status: 500 });
    }

    const existingOrderIds = new Set((existingTxs || []).map((t: any) => t.order_id));

    // 3. Para cada order paga SEM wallet_transaction, criar o lançamento
    let reconciledCount = 0;
    const errors: string[] = [];

    for (const order of paidOrders) {
      if (existingOrderIds.has(order.id)) {
        continue; // Já tem transação, pula
      }

      // Buscar os itens do pedido
      const { data: itemsData } = await supabaseAdmin
        .from('order_items')
        .select('*')
        .eq('order_id', order.id);

      const productCount = itemsData && itemsData.length > 0 ? itemsData.length : 1;
      const grossAmount = Number(order.total_amount || order.subtotal_amount || 0);
      
      // Recalcular taxas
      const platformFixedFee = Number((productCount * 0.99).toFixed(2));
      const platformPercentageFee = 0; // 0% conforme configuração atual
      const platformFee = platformFixedFee + platformPercentageFee;
      
      let asaasFee = Number(order.asaas_fee_amount || 0);
      if (asaasFee <= 0) {
        const method = (order.payment_method || 'pix').toString().toLowerCase();
        asaasFee = estimateAsaasFee(method, grossAmount);
      }

      const netAmount = Number(Math.max(0, grossAmount - platformFee - asaasFee).toFixed(2));

      const txId = `tx_reconcile_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const productTitle = itemsData && itemsData[0] ? (itemsData[0].product_title || 'Infoproduto') : 'Infoproduto Digital';

      const { error: insertErr } = await supabaseAdmin.from('wallet_transactions').insert([{
        id: txId,
        store_id: order.store_id,
        order_id: order.id,
        type: 'SALE',
        status: 'COMPLETED',
        gross_amount: grossAmount,
        platform_fixed_fee_amount: platformFixedFee,
        platform_percentage_fee_amount: platformPercentageFee,
        platform_fee_amount: platformFee,
        asaas_fee_amount: asaasFee,
        net_amount: netAmount,
        description: `Venda reconciliada — Pedido #${order.id.substring(4, 10).toUpperCase()} (${productTitle})`,
        created_at: order.paid_at || order.created_at || new Date().toISOString()
      }]);

      if (insertErr) {
        console.error(`[Reconcile] Erro ao inserir tx para order ${order.id}:`, insertErr);
        errors.push(`Order ${order.id}: ${insertErr.message}`);
      } else {
        reconciledCount++;
        console.log(`[Reconcile] ✅ Transação SALE criada para order ${order.id} | Líquido: R$ ${netAmount}`);
      }

      // Também conceder acesso ao produto para o aluno
      if (order.buyer_email && itemsData && itemsData.length > 0) {
        for (const item of itemsData) {
          const accId = `acc_reconcile_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
          
          // Verificar se já tem acesso
          const { data: existingAccess } = await supabaseAdmin
            .from('student_product_access')
            .select('id')
            .eq('student_id', order.buyer_email.toLowerCase().trim())
            .eq('product_id', item.product_id)
            .maybeSingle();

          if (!existingAccess) {
            await supabaseAdmin.from('student_product_access').insert([{
              id: accId,
              student_id: order.buyer_email.toLowerCase().trim(),
              product_id: item.product_id,
              order_id: order.id,
              store_id: order.store_id,
              status: 'ACTIVE',
              granted_at: order.paid_at || order.created_at || new Date().toISOString()
            }]);
          }
        }
      }
    }

    // 4. Também verificar orders que o Asaas confirmou como pago mas nosso BD ainda marca como pending
    // Buscar orders pending que tenham asaas_payment_id (foram enviadas ao Asaas)
    const { data: pendingOrders } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('status', 'pending')
      .not('asaas_payment_id', 'is', null);

    let updatedPendingCount = 0;

    if (pendingOrders && pendingOrders.length > 0) {
      // Para cada uma, verificar no Asaas se foi paga
      const ASAAS_API_KEY = process.env.ASAAS_API_KEY || '';
      const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://api.asaas.com/v3';

      if (ASAAS_API_KEY && !ASAAS_API_KEY.includes('demo')) {
        for (const pendingOrder of pendingOrders) {
          try {
            const res = await fetch(`${ASAAS_API_URL}/payments/${pendingOrder.asaas_payment_id}`, {
              headers: {
                'Content-Type': 'application/json',
                'access_token': ASAAS_API_KEY
              }
            });

            if (res.ok) {
              const paymentData = await res.json();
              
              if (paymentData.status === 'RECEIVED' || paymentData.status === 'CONFIRMED') {
                // Atualizar para paid no nosso banco
                let realFee = 0;
                if (paymentData.value && paymentData.netValue) {
                  realFee = Math.max(0, Number(paymentData.value) - Number(paymentData.netValue));
                }

                const productCount = 1; // Simplificação
                const platformFee = Number((productCount * 0.99).toFixed(2));
                const asaasFee = realFee > 0 ? realFee : Number(pendingOrder.asaas_fee_amount || 1.99);
                const netAmount = Number(Math.max(0, Number(pendingOrder.total_amount) - platformFee - asaasFee).toFixed(2));

                await supabaseAdmin.from('orders').update({
                  status: 'paid',
                  paid_at: new Date().toISOString(),
                  asaas_fee_amount: asaasFee,
                  creator_net_amount: netAmount
                }).eq('id', pendingOrder.id);

                // Criar wallet_transaction
                const txId = `tx_reconcile_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
                await supabaseAdmin.from('wallet_transactions').insert([{
                  id: txId,
                  store_id: pendingOrder.store_id,
                  order_id: pendingOrder.id,
                  type: 'SALE',
                  status: 'COMPLETED',
                  gross_amount: Number(pendingOrder.total_amount),
                  platform_fixed_fee_amount: platformFee,
                  platform_percentage_fee_amount: 0,
                  platform_fee_amount: platformFee,
                  asaas_fee_amount: asaasFee,
                  net_amount: netAmount,
                  description: `Venda reconciliada (Asaas Confirmed) — Pedido #${pendingOrder.id.substring(4, 10).toUpperCase()}`,
                  created_at: new Date().toISOString()
                }]);

                updatedPendingCount++;
                console.log(`[Reconcile] ✅ Order ${pendingOrder.id} atualizada de PENDING → PAID via Asaas check`);
              }
            }
          } catch (e) {
            console.error(`[Reconcile] Erro ao verificar payment ${pendingOrder.asaas_payment_id}:`, e);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      totalPaidOrders: paidOrders.length,
      alreadyHadTransaction: paidOrders.length - reconciledCount,
      reconciled: reconciledCount,
      pendingUpdatedToPaid: updatedPendingCount,
      errors: errors.length > 0 ? errors : undefined,
      message: `Reconciliação concluída. ${reconciledCount} transações criadas. ${updatedPendingCount} pedidos pendentes atualizados para pago.`
    });

  } catch (err: any) {
    console.error('[Reconcile API Error]:', err);
    return NextResponse.json({ error: err.message || 'Erro interno.' }, { status: 500 });
  }
}
