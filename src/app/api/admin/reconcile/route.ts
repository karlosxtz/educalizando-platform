import { NextResponse } from 'next/server';
import { supabaseAdmin, isRealSupabaseConfigured } from '@/lib/supabase';
import { updateOrderStatus } from '@/lib/order-service';
import { isSuperAdmin } from '@/lib/api-auth';

/**
 * API de Reconciliação Financeira — Força Bruta
 * Busca TODAS as orders com status 'paid' no Supabase e garante que cada uma
 * tenha uma wallet_transaction SALE correspondente.
 * Se não tiver, cria a transação faltante.
 * 
 * POST /api/admin/reconcile
 */
export async function POST(request: Request) {
  try {
    if (!(await isSuperAdmin(request))) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

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

    // 3. Reprocessar todas as vendas pagas pelo mesmo motor idempotente do webhook.
    // Isso repara tanto ledger quanto acessos sem duplicar lançamentos ou e-mails.
    let reconciledCount = 0;
    const errors: string[] = [];

    for (const order of paidOrders) {
      try {
        await updateOrderStatus(order.id, 'paid', undefined, Number(order.asaas_fee_amount || 0));
        if (!existingOrderIds.has(order.id)) reconciledCount++;
      } catch (error: any) {
        errors.push(`Pedido ${order.id}: ${error?.message || 'falha desconhecida'}`);
      }
    }

    return NextResponse.json({
      success: true,
      totalPaidOrders: paidOrders.length,
      alreadyHadTransaction: paidOrders.length - reconciledCount,
      reconciled: reconciledCount,
      errors: errors.length > 0 ? errors : undefined,
      message: `Reconciliação concluída. ${reconciledCount} transações criadas.`
    });

  } catch (err: any) {
    console.error('[Reconcile API Error]:', err);
    return NextResponse.json({ error: err.message || 'Erro interno.' }, { status: 500 });
  }
}
