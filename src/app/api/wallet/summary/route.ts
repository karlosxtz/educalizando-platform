import { NextResponse } from 'next/server';
import { supabaseAdmin, isRealSupabaseConfigured } from '@/lib/supabase';
import { getRequestUser } from '@/lib/api-auth';
import { calculatePlatformFee } from '@/lib/payment-fees';

// Constantes centralizadas de cálculo financeiro (devem espelhar order-service.ts)
const ASAAS_PIX_FEE = 1.99;
const ASAAS_CC_FIXED_FEE = 0.49;
const ASAAS_CC_PERCENTAGE_FEE = 0.0299;

/**
 * API Server-Side para buscar dados financeiros do criador.
 * Roda no servidor onde supabaseAdmin tem a Service Role Key,
 * podendo ler dados bloqueados pelo RLS.
 *
 * GET /api/wallet/summary?storeId=xxx
 * GET /api/wallet/summary?storeId=xxx&force=true  (ignora cache)
 *
 * Cache: 60s s-maxage + 30s stale-while-revalidate
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const storeId = url.searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json({ error: 'storeId é obrigatório.' }, { status: 400 });
    }

    if (!isRealSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 500 });
    }

    // Autenticação: verificar se o usuário logado é dono dessa loja
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Token inválido ou expirado.' }, { status: 401 });
    }

    // Verificar propriedade da loja
    const { data: storeData } = await supabaseAdmin
      .from('stores')
      .select('creator_id')
      .eq('id', storeId)
      .maybeSingle();

    if (!storeData || storeData.creator_id !== user.id) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    // Pedidos, livro-caixa e saques são a fonte de verdade do resumo.
    const [ordersResult, exclusivePaymentsResult, txResult, withdrawalsResult] = await Promise.all([
      supabaseAdmin.from('orders').select('*').eq('store_id', storeId),
      supabaseAdmin
        .from('exclusive_material_payments')
        .select('gross_amount,platform_fee_amount,creator_net_amount,status,request:exclusive_material_requests!inner(store_id)')
        .eq('request.store_id', storeId),
      supabaseAdmin.from('wallet_transactions').select('*').eq('store_id', storeId),
      supabaseAdmin.from('withdrawals').select('amount, status').eq('store_id', storeId)
    ]);

    if (ordersResult.error) {
      console.error('[API Wallet Summary] Erro orders:', ordersResult.error);
    }
    if (txResult.error) {
      console.error('[API Wallet Summary] Erro wallet_transactions:', txResult.error);
    }
    if (exclusivePaymentsResult.error) {
      console.error('[API Wallet Summary] Erro exclusive_material_payments:', exclusivePaymentsResult.error);
    }
    if (withdrawalsResult.error) {
      console.error('[API Wallet Summary] Erro withdrawals:', withdrawalsResult.error);
    }

    const allOrders = ordersResult.data || [];
    const allExclusivePayments = exclusivePaymentsResult.data || [];
    const allTx = txResult.data || [];
    const completedWithdrawals = (withdrawalsResult.data || []).filter((withdrawal: any) =>
      String(withdrawal.status || '').toUpperCase() === 'COMPLETED'
    );

    // Calcular resumo financeiro
    const isOrderPaid = (o: any) => {
      const st = (o.status || '').toString().toLowerCase();
      return st === 'paid' || st === 'pago' || st === 'received' || st === 'confirmed';
    };

    const isOrderPending = (o: any) => {
      const st = (o.status || '').toString().toLowerCase();
      return st === 'pending' || st === 'pendente_pix' || st === 'waiting_payment';
    };

    const paidOrders = allOrders.filter(isOrderPaid);
    const pendingOrders = allOrders.filter(isOrderPending);
    const paidExclusivePayments = allExclusivePayments.filter((payment: any) => payment.status === 'paid');
    const pendingExclusivePayments = allExclusivePayments.filter((payment: any) => payment.status === 'pending');

    const totalVendido = paidOrders.reduce((sum: number, o: any) =>
      sum + Number(o.total_amount || o.subtotal_amount || 0), 0) + paidExclusivePayments.reduce((sum: number, payment: any) =>
      sum + Number(payment.gross_amount || 0), 0);

    let taxasEducalizando = 0;
    let taxasAsaas = 0;
    let saldoDisponivel = 0;
    let saldoPendente = 0;

    paidOrders.forEach((o: any) => {
      const gross = Number(o.total_amount || o.subtotal_amount || 0);
      const productCount = Number(o.product_count || 1);
      const method = (o.payment_method || 'pix').toString().toLowerCase();
      const platformFee = Number(o.platform_fee_amount ?? calculatePlatformFee(gross, method));

      let paymentFee = Number(o.asaas_fee_amount || 0);
      const provider = o.payment_provider || (o.asaas_payment_id ? 'asaas' : 'infinitepay');
      if (paymentFee <= 0 && provider === 'asaas') {
        paymentFee = method === 'credit_card'
          ? Number((ASAAS_CC_FIXED_FEE + gross * ASAAS_CC_PERCENTAGE_FEE).toFixed(2))
          : ASAAS_PIX_FEE;
      }

      const net = Number((gross - platformFee - paymentFee).toFixed(2));
      taxasEducalizando += platformFee;
      taxasAsaas += paymentFee;
      saldoDisponivel += Math.max(0, net);
    });

    pendingOrders.forEach((o: any) => {
      const gross = Number(o.total_amount || o.subtotal_amount || 0);
      const method = (o.payment_method || 'pix').toString().toLowerCase();
      const platformFee = Number(o.platform_fee_amount ?? calculatePlatformFee(gross, method));
      let paymentFee = Number(o.asaas_fee_amount || 0);
      const provider = o.payment_provider || (o.asaas_payment_id ? 'asaas' : 'infinitepay');
      if (paymentFee <= 0 && provider === 'asaas') paymentFee = ASAAS_PIX_FEE;
      const net = Number(Math.max(0, gross - platformFee - paymentFee).toFixed(2));
      saldoPendente += net;
    });

    paidExclusivePayments.forEach((payment: any) => {
      taxasEducalizando += Number(payment.platform_fee_amount || 0);
      saldoDisponivel += Math.max(0, Number(payment.creator_net_amount || 0));
    });

    pendingExclusivePayments.forEach((payment: any) => {
      saldoPendente += Math.max(0, Number(payment.creator_net_amount || 0));
    });

    // Se há transações consolidadas no ledger, preferir esse saldo
    if (allTx.length > 0) {
      const ledgerNet = allTx
        .filter((t: any) => t.status === 'COMPLETED')
        .reduce((sum: number, t: any) => sum + Number(t.net_amount || 0), 0);
      saldoDisponivel = ledgerNet;
    }

    const totalTaxas = Number((taxasEducalizando + taxasAsaas).toFixed(2));
    const totalRecebido = completedWithdrawals.reduce(
      (sum: number, withdrawal: any) => sum + Math.max(0, Number(withdrawal.amount || 0)),
      0
    );

    const summary = {
      totalVendido: Number(totalVendido.toFixed(2)),
      saldoPendente: Number(saldoPendente.toFixed(2)),
      saldoDisponivel: Number(Math.max(0, saldoDisponivel).toFixed(2)),
      totalRecebido: Number(totalRecebido.toFixed(2)),
      taxasEducalizando: Number(taxasEducalizando.toFixed(2)),
      taxasAsaas: Number(taxasAsaas.toFixed(2)),
      taxasGateway: Number(taxasAsaas.toFixed(2)),
      totalTaxas
    };

    return NextResponse.json({ summary }, {
      headers: { 'Cache-Control': 'no-store' }
    });

  } catch (err: any) {
    console.error('[API Wallet Summary Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
