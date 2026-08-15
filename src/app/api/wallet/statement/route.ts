import { NextResponse } from 'next/server';
import { supabaseAdmin, isRealSupabaseConfigured } from '@/lib/supabase';

/**
 * API Server-Side para buscar extrato de transações financeiras do criador.
 * 
 * GET /api/wallet/statement?storeId=xxx&period=all&status=all&search=&page=1&limit=15
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const storeId = url.searchParams.get('storeId');
    const period = url.searchParams.get('period') || 'all';
    const status = url.searchParams.get('status') || 'all';
    const search = url.searchParams.get('search') || '';
    const page = Number(url.searchParams.get('page') || '1');
    const limit = Number(url.searchParams.get('limit') || '15');

    if (!storeId) {
      return NextResponse.json({ error: 'storeId é obrigatório.' }, { status: 400 });
    }

    if (!isRealSupabaseConfigured()) {
      return NextResponse.json({ transactions: [], totalCount: 0, page: 1, totalPages: 1 });
    }

    // Buscar transações do Supabase usando admin (bypassa RLS)
    const { data: txData, error: txErr } = await supabaseAdmin
      .from('wallet_transactions')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (txErr) {
      console.error('[API Wallet Statement] Erro:', txErr);
      return NextResponse.json({ transactions: [], totalCount: 0, page: 1, totalPages: 1 });
    }

    let allTx = (txData || []).map((t: any) => ({
      id: t.id,
      storeId: t.store_id,
      creatorId: t.creator_id,
      orderId: t.order_id,
      buyerName: t.buyer_name || null,
      productTitle: t.product_title || null,
      type: t.type,
      status: t.status,
      grossAmount: Number(t.gross_amount || 0),
      platformFixedFeeAmount: Number(t.platform_fixed_fee_amount || 0),
      platformPercentageFeeAmount: Number(t.platform_percentage_fee_amount || 0),
      platformFeeAmount: Number(t.platform_fee_amount || 0),
      asaasFeeAmount: Number(t.asaas_fee_amount || 0),
      netAmount: Number(t.net_amount || 0),
      description: t.description || '',
      createdAt: t.created_at
    }));

    // Filtro de período
    const now = new Date();
    if (period !== 'all') {
      allTx = allTx.filter((t: any) => {
        const txDate = new Date(t.createdAt);
        if (period === 'today') return txDate.toDateString() === now.toDateString();
        if (period === '7d') return txDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (period === '30d') return txDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (period === 'month') return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
        if (period === 'last_month') {
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          return txDate.getMonth() === lastMonth.getMonth() && txDate.getFullYear() === lastMonth.getFullYear();
        }
        return true;
      });
    }

    // Filtro de status
    if (status !== 'all') {
      if (status === 'REFUND') {
        allTx = allTx.filter((t: any) => t.type === 'REFUND');
      } else {
        allTx = allTx.filter((t: any) => t.status === status && t.type !== 'REFUND');
      }
    }

    // Filtro de busca
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      allTx = allTx.filter((t: any) =>
        (t.orderId && t.orderId.toLowerCase().includes(q)) ||
        (t.productTitle && t.productTitle.toLowerCase().includes(q)) ||
        (t.buyerName && t.buyerName.toLowerCase().includes(q)) ||
        t.description.toLowerCase().includes(q)
      );
    }

    // Paginação
    const totalCount = allTx.length;
    const totalPages = Math.ceil(totalCount / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginated = allTx.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      transactions: paginated,
      totalCount,
      page,
      totalPages
    });

  } catch (err: any) {
    console.error('[API Wallet Statement Error]:', err);
    return NextResponse.json({ transactions: [], totalCount: 0, page: 1, totalPages: 1 });
  }
}
