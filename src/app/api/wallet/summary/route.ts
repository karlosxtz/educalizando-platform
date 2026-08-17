import { NextResponse } from 'next/server';
import { supabaseAdmin, isRealSupabaseConfigured } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

// Constantes centralizadas de cálculo financeiro (devem espelhar order-service.ts)
const PLATFORM_FIXED_FEE_PER_PRODUCT = 0.99;
const PLATFORM_PERCENTAGE_FEE = 0.05;
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
    const forceRefresh = url.searchParams.get('force') === 'true';

    if (!storeId) {
      return NextResponse.json({ error: 'storeId é obrigatório.' }, { status: 400 });
    }

    if (!isRealSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 500 });
    }

    // Autenticação: verificar se o usuário logado é dono dessa loja
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autenticação ausente.' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData?.user) {
      return NextResponse.json({ error: 'Token inválido ou expirado.' }, { status: 401 });
    }

    // Verificar propriedade da loja
    const { data: storeData } = await supabaseAdmin
      .from('stores')
      .select('creator_id')
      .eq('id', storeId)
      .maybeSingle();

    if (storeData && storeData.creator_id !== userData.user.id) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    // Buscar orders e wallet_transactions em paralelo
    const [ordersResult, txResult] = await Promise.all([
      supabaseAdmin.from('orders').select('*').eq('store_id', storeId),
      supabaseAdmin.from('wallet_transactions').select('*').eq('store_id', storeId)
    ]);

    if (ordersResult.error) {
      console.error('[API Wallet Summary] Erro orders:', ordersResult.error);
    }
    if (txResult.error) {
      console.error('[API Wallet Summary] Erro wallet_transactions:', txResult.error);
    }

    const allOrders = ordersResult.data || [];
    const allTx = txResult.data || [];

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

    const totalVendido = paidOrders.reduce((sum: number, o: any) =>
      sum + Number(o.total_amount || o.subtotal_amount || 0), 0);

    let taxasEducalizando = 0;
    let taxasAsaas = 0;
    let saldoDisponivel = 0;
    let saldoPendente = 0;

    paidOrders.forEach((o: any) => {
      const gross = Number(o.total_amount || o.subtotal_amount || 0);
      const productCount = Number(o.product_count || 1);
      const platformFee = Number((productCount * PLATFORM_FIXED_FEE_PER_PRODUCT + gross * PLATFORM_PERCENTAGE_FEE).toFixed(2));

      let paymentFee = Number(o.asaas_fee_amount || 0);
      if (paymentFee <= 0) {
        const method = (o.payment_method || 'pix').toString().toLowerCase();
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
      const platformFee = Number((PLATFORM_FIXED_FEE_PER_PRODUCT + gross * PLATFORM_PERCENTAGE_FEE).toFixed(2));
      let paymentFee = Number(o.asaas_fee_amount || 0);
      if (paymentFee <= 0) paymentFee = ASAAS_PIX_FEE;
      const net = Number(Math.max(0, gross - platformFee - paymentFee).toFixed(2));
      saldoPendente += net;
    });

    // Se há transações consolidadas no ledger, preferir esse saldo
    if (allTx.length > 0) {
      const ledgerNet = allTx
        .filter((t: any) => t.status === 'COMPLETED')
        .reduce((sum: number, t: any) => sum + Number(t.net_amount || 0), 0);
      if (ledgerNet > 0) saldoDisponivel = ledgerNet;
    }

    const totalTaxas = Number((taxasEducalizando + taxasAsaas).toFixed(2));

    const summary = {
      totalVendido: Number(totalVendido.toFixed(2)),
      saldoPendente: Number(saldoPendente.toFixed(2)),
      saldoDisponivel: Number(Math.max(0, saldoDisponivel).toFixed(2)),
      totalRecebido: 0,
      taxasEducalizando: Number(taxasEducalizando.toFixed(2)),
      taxasAsaas: Number(taxasAsaas.toFixed(2)),
      totalTaxas
    };

    // Cache HTTP: 60s no CDN/Vercel Edge, 30s stale-while-revalidate
    // ?force=true bypassa o cache (útil após nova venda)
    const cacheControl = forceRefresh
      ? 'no-store'
      : 's-maxage=60, stale-while-revalidate=30';

    return NextResponse.json({ summary }, {
      headers: { 'Cache-Control': cacheControl }
    });

  } catch (err: any) {
    console.error('[API Wallet Summary Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

