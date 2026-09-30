import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';
import type { PeriodFilter, RecentOrder, SalesDataPoint } from '@/lib/types';

const validPeriods = new Set<PeriodFilter>(['7d', '30d', 'month', 'year']);

type UnifiedSale = {
  id: string;
  customerName: string;
  customerEmail: string;
  title: string;
  amount: number;
  status: 'paid' | 'pending' | 'expired';
  occurredAt: string;
  paymentMethod: RecentOrder['metodoPagamento'];
  source: 'catalog' | 'plr' | 'exclusive';
};

function periodStart(period: PeriodFilter, now: Date) {
  const start = new Date(now);
  if (period === '7d') start.setDate(now.getDate() - 6);
  if (period === '30d') start.setDate(now.getDate() - 29);
  if (period === 'month') start.setTime(new Date(now.getFullYear(), now.getMonth(), 1).getTime());
  if (period === 'year') start.setTime(new Date(now.getFullYear(), 0, 1).getTime());
  start.setHours(0, 0, 0, 0);
  return start;
}

function buildChart(sales: UnifiedSale[], period: PeriodFilter, now: Date): SalesDataPoint[] {
  const paid = sales.filter((sale) => sale.status === 'paid');
  if (period === '7d') {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() - (6 - index));
      const key = date.toISOString().slice(0, 10);
      const matches = paid.filter((sale) => sale.occurredAt.slice(0, 10) === key);
      const weekday = date.toLocaleDateString('pt-BR', { weekday: 'short' });
      return { date: key, label: weekday.charAt(0).toUpperCase() + weekday.slice(1, 3), revenue: matches.reduce((sum, sale) => sum + sale.amount, 0), salesCount: matches.length };
    });
  }
  if (period === '30d') {
    const start = periodStart(period, now);
    const weeks: SalesDataPoint[] = Array.from({ length: 4 }, (_, index) => ({ date: `Semana ${index + 1}`, label: `Sem ${index + 1}`, revenue: 0, salesCount: 0 }));
    paid.forEach((sale) => {
      const diff = Math.max(0, new Date(sale.occurredAt).getTime() - start.getTime());
      const index = Math.min(3, Math.floor(diff / (7 * 24 * 60 * 60 * 1000)));
      weeks[index].revenue += sale.amount;
      weeks[index].salesCount += 1;
    });
    return weeks;
  }
  if (period === 'month') {
    const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return Array.from({ length: days }, (_, index) => {
      const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`;
      const matches = paid.filter((sale) => sale.occurredAt.slice(0, 10) === key);
      return { date: key, label: String(index + 1), revenue: matches.reduce((sum, sale) => sum + sale.amount, 0), salesCount: matches.length };
    });
  }
  const labels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return labels.map((label, index) => {
    const key = `${now.getFullYear()}-${String(index + 1).padStart(2, '0')}`;
    const matches = paid.filter((sale) => sale.occurredAt.slice(0, 7) === key);
    return { date: key, label, revenue: matches.reduce((sum, sale) => sum + sale.amount, 0), salesCount: matches.length };
  });
}

export async function GET(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const url = new URL(request.url);
  const storeId = url.searchParams.get('storeId') || '';
  const requestedPeriod = url.searchParams.get('period') as PeriodFilter;
  const period: PeriodFilter = validPeriods.has(requestedPeriod) ? requestedPeriod : '30d';
  if (!storeId) return NextResponse.json({ error: 'Loja obrigatória.' }, { status: 400 });

  const { data: store } = await supabaseAdmin.from('stores').select('id').eq('id', storeId).eq('creator_id', user.id).maybeSingle();
  if (!store) return NextResponse.json({ error: 'Loja não encontrada ou sem permissão.' }, { status: 403 });

  const [ordersResult, exclusiveResult, exclusiveRequestsResult] = await Promise.all([
    supabaseAdmin.from('orders').select('id,buyer_name,buyer_email,total_amount,subtotal_amount,status,created_at,paid_at,is_plr_purchase,payment_method,items:order_items(product_title)').eq('store_id', storeId),
    supabaseAdmin
      .from('exclusive_material_payments')
      .select('id,gross_amount,platform_fee_amount,creator_net_amount,status,created_at,paid_at,request:exclusive_material_requests!inner(store_id,title,customer_name,customer_email)')
      .eq('request.store_id', storeId),
    supabaseAdmin
      .from('exclusive_material_requests')
      .select('id,status,accepted_proposal_id,created_at,delivered_at')
      .eq('store_id', storeId),
  ]);
  if (ordersResult.error || exclusiveResult.error || exclusiveRequestsResult.error) {
    console.error('[Dashboard Sales Analytics]', ordersResult.error || exclusiveResult.error || exclusiveRequestsResult.error);
    return NextResponse.json({ error: 'Não foi possível consolidar as vendas da loja.' }, { status: 500 });
  }

  const catalogSales: UnifiedSale[] = (ordersResult.data || []).map((order) => {
    const titles = (order.items || []).map((item) => item.product_title).filter(Boolean);
    const title = titles.length > 1 ? `${titles[0]} + ${titles.length - 1} item(ns)` : titles[0] || (order.is_plr_purchase ? 'Licença PLR' : 'Material da loja');
    return {
      id: order.id,
      customerName: order.buyer_name || 'Cliente Educalizando',
      customerEmail: order.buyer_email || '',
      title,
      amount: Number(order.total_amount || order.subtotal_amount || 0),
      status: ['paid', 'pago', 'received', 'confirmed'].includes(String(order.status).toLowerCase()) ? 'paid' : ['refunded', 'expired', 'failed', 'cancelled'].includes(String(order.status).toLowerCase()) ? 'expired' : 'pending',
      occurredAt: order.paid_at || order.created_at,
      paymentMethod: ['credit_card', 'debit_card'].includes(String(order.payment_method).toLowerCase()) ? 'CREDIT_CARD' : String(order.payment_method).toLowerCase() === 'boleto' ? 'BOLETO' : 'PIX',
      source: order.is_plr_purchase ? 'plr' : 'catalog',
    };
  });

  const exclusiveSales: UnifiedSale[] = (exclusiveResult.data || []).map((payment) => {
    const relation = Array.isArray(payment.request) ? payment.request[0] : payment.request;
    return {
      id: payment.id,
      customerName: relation?.customer_name || 'Cliente Educalizando',
      customerEmail: relation?.customer_email || '',
      title: relation?.title || 'Material exclusivo',
      amount: Number(payment.gross_amount || 0),
      status: payment.status === 'paid' ? 'paid' : ['failed', 'cancelled'].includes(payment.status) ? 'expired' : 'pending',
      occurredAt: payment.paid_at || payment.created_at,
      paymentMethod: 'PIX',
      source: 'exclusive',
    };
  });

  const allSales = [...catalogSales, ...exclusiveSales];
  const now = new Date();
  const start = periodStart(period, now);
  const periodSales = allSales.filter((sale) => new Date(sale.occurredAt) >= start && new Date(sale.occurredAt) <= now);
  const recentOrders: Array<RecentOrder & { saleSource: UnifiedSale['source'] }> = allSales
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
    .slice(0, 10)
    .map((sale) => ({
      id: sale.id,
      clienteNome: sale.customerName,
      clienteEmail: sale.customerEmail,
      produtoTitulo: sale.source === 'exclusive' ? `Exclusivo: ${sale.title}` : sale.title,
      tipoProduto: 'pdf',
      valorTotal: sale.amount,
      statusPagamento: sale.status === 'paid' ? 'pago' : sale.status === 'expired' ? 'expirado' : 'pendente_pix',
      dataCompra: new Date(sale.occurredAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
      metodoPagamento: sale.paymentMethod,
      saleSource: sale.source,
    }));
  const exclusivePaid = periodSales.filter((sale) => sale.source === 'exclusive' && sale.status === 'paid');
  const allExclusiveRequests = exclusiveRequestsResult.data || [];
  const allPaidExclusivePayments = (exclusiveResult.data || []).filter((payment) => payment.status === 'paid');
  const acceptedRequests = allExclusiveRequests.filter((item) => Boolean(item.accepted_proposal_id));
  const exclusiveGrossRevenue = allPaidExclusivePayments.reduce((sum, payment) => sum + Number(payment.gross_amount || 0), 0);
  const exclusiveCreatorNet = allPaidExclusivePayments.reduce((sum, payment) => sum + Number(payment.creator_net_amount || 0), 0);
  const exclusivePlatformFees = allPaidExclusivePayments.reduce((sum, payment) => sum + Number(payment.platform_fee_amount || 0), 0);
  const countStatus = (...statuses: string[]) => allExclusiveRequests.filter((item) => statuses.includes(item.status)).length;

  return NextResponse.json({
    chartData: buildChart(periodSales, period, now),
    totalGeneratedCount: periodSales.length,
    recentOrders,
    exclusivePerformance: {
      salesCount: exclusivePaid.length,
      revenue: Number(exclusivePaid.reduce((sum, sale) => sum + sale.amount, 0).toFixed(2)),
    },
    exclusiveOverview: {
      received: allExclusiveRequests.length,
      accepted: acceptedRequests.length,
      paid: allPaidExclusivePayments.length,
      delivered: countStatus('delivered'),
      negotiating: countStatus('open', 'negotiating'),
      awaitingPayment: countStatus('awaiting_payment'),
      inProduction: countStatus('paid', 'in_production'),
      cancelled: countStatus('cancelled', 'rejected'),
      grossRevenue: Number(exclusiveGrossRevenue.toFixed(2)),
      creatorNet: Number(exclusiveCreatorNet.toFixed(2)),
      platformFees: Number(exclusivePlatformFees.toFixed(2)),
      averageTicket: allPaidExclusivePayments.length ? Number((exclusiveGrossRevenue / allPaidExclusivePayments.length).toFixed(2)) : 0,
      acceptanceRate: allExclusiveRequests.length ? Number(((acceptedRequests.length / allExclusiveRequests.length) * 100).toFixed(1)) : 0,
      paymentRate: acceptedRequests.length ? Number(((allPaidExclusivePayments.length / acceptedRequests.length) * 100).toFixed(1)) : 0,
      deliveryRate: allPaidExclusivePayments.length ? Number(((countStatus('delivered') / allPaidExclusivePayments.length) * 100).toFixed(1)) : 0,
    },
  }, { headers: { 'Cache-Control': 'no-store' } });
}
