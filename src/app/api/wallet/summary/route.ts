import { NextResponse } from 'next/server';
import { supabaseAdmin, isRealSupabaseConfigured } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

/**
 * API Server-Side para buscar dados financeiros do criador.
 * Roda no servidor onde supabaseAdmin tem a Service Role Key,
 * podendo ler dados bloqueados pelo RLS.
 * 
 * GET /api/wallet/summary?storeId=xxx
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
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: userData } = await supabase.auth.getUser(token);
      if (userData?.user) {
        const { data: storeData } = await supabaseAdmin
          .from('stores')
          .select('creator_id')
          .eq('id', storeId)
          .maybeSingle();

        if (storeData && storeData.creator_id !== userData.user.id) {
          return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
        }
      }
    }

    // 1. Buscar orders
    const { data: orders, error: ordersErr } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('store_id', storeId);

    if (ordersErr) {
      console.error('[API Wallet Summary] Erro orders:', ordersErr);
    }

    // 2. Buscar wallet_transactions
    const { data: transactions, error: txErr } = await supabaseAdmin
      .from('wallet_transactions')
      .select('*')
      .eq('store_id', storeId);

    if (txErr) {
      console.error('[API Wallet Summary] Erro wallet_transactions:', txErr);
    }

    const allOrders = orders || [];
    const allTx = transactions || [];

    // 3. Calcular resumo financeiro
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

    const totalVendido = paidOrders.reduce((sum: number, o: any) => 
      sum + Number(o.total_amount || o.subtotal_amount || 0), 0);

    let taxasEducalizando = 0;
    let taxasAsaas = 0;
    let saldoDisponivel = 0;
    let saldoPendente = 0;

    paidOrders.forEach((o: any) => {
      const gross = Number(o.total_amount || o.subtotal_amount || 0);
      const productCount = 1; // Simplificação
      const platformFee = Number((productCount * 0.99).toFixed(2));

      let paymentFee = Number(o.asaas_fee_amount || 0);
      if (paymentFee <= 0) {
        const method = (o.payment_method || 'pix').toString().toLowerCase();
        if (method === 'credit_card') paymentFee = Number((0.49 + (gross * 0.0299)).toFixed(2));
        else paymentFee = 1.99;
      }

      const net = Number((gross - platformFee - paymentFee).toFixed(2));
      taxasEducalizando += platformFee;
      taxasAsaas += paymentFee;
      saldoDisponivel += Math.max(0, net);
    });

    pendingOrders.forEach((o: any) => {
      const gross = Number(o.total_amount || o.subtotal_amount || 0);
      const platformFee = 0.99;
      let paymentFee = Number(o.asaas_fee_amount || 0);
      if (paymentFee <= 0) paymentFee = 1.99;
      const net = Number(Math.max(0, gross - platformFee - paymentFee).toFixed(2));
      saldoPendente += net;
    });

    // Se há transações no ledger, usar o saldo consolidado
    if (allTx.length > 0) {
      const ledgerNet = allTx
        .filter((t: any) => t.status === 'COMPLETED')
        .reduce((sum: number, t: any) => sum + Number(t.net_amount || 0), 0);
      if (ledgerNet > 0) {
        saldoDisponivel = ledgerNet;
      }
    }

    const totalTaxas = Number((taxasEducalizando + taxasAsaas).toFixed(2));

    return NextResponse.json({
      summary: {
        totalVendido: Number(totalVendido.toFixed(2)),
        saldoPendente: Number(saldoPendente.toFixed(2)),
        saldoDisponivel: Number(Math.max(0, saldoDisponivel).toFixed(2)),
        totalRecebido: 0,
        taxasEducalizando: Number(taxasEducalizando.toFixed(2)),
        taxasAsaas: Number(taxasAsaas.toFixed(2)),
        totalTaxas
      }
    });

  } catch (err: any) {
    console.error('[API Wallet Summary Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
