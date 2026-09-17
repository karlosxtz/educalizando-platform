import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const storeId = new URL(request.url).searchParams.get('storeId');
  if (!storeId) return NextResponse.json({ error: 'Loja inválida.' }, { status: 400 });

  const { data: store } = await supabaseAdmin.from('stores').select('id').eq('id', storeId).eq('creator_id', user.id).maybeSingle();
  if (!store) return NextResponse.json({ error: 'Loja não encontrada ou sem permissão.' }, { status: 403 });

  const { data: affiliates, error: affiliatesError } = await supabaseAdmin
    .from('affiliates').select('id,status').eq('store_id', storeId);
  if (affiliatesError) return NextResponse.json({ error: affiliatesError.message }, { status: 500 });
  const affiliateIds = (affiliates || []).map((affiliate) => affiliate.id);
  if (!affiliateIds.length) return NextResponse.json({ success: true, report: { totalAffiliates: 0, approvedAffiliates: 0, clicks: 0, sales: 0, revenue: 0, commissions: 0, conversion: 0 } });

  const [{ count: clicks }, { data: orders, error: ordersError }] = await Promise.all([
    supabaseAdmin.from('affiliate_clicks').select('id', { count: 'exact', head: true }).in('affiliate_id', affiliateIds).eq('store_id', storeId),
    supabaseAdmin.from('orders').select('id,total_amount,affiliate_commission_amount').eq('store_id', storeId).eq('status', 'paid').in('affiliate_id', affiliateIds),
  ]);
  if (ordersError) return NextResponse.json({ error: ordersError.message }, { status: 500 });
  const sales = orders?.length || 0;
  const revenue = (orders || []).reduce((total, order) => total + Number(order.total_amount || 0), 0);
  const commissions = (orders || []).reduce((total, order) => total + Number(order.affiliate_commission_amount || 0), 0);
  return NextResponse.json({ success: true, report: { totalAffiliates: affiliateIds.length, approvedAffiliates: (affiliates || []).filter((affiliate) => affiliate.status === 'aprovado').length, clicks: clicks || 0, sales, revenue, commissions, conversion: clicks ? (sales / clicks) * 100 : 0 } });
}
