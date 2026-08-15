import { NextResponse } from 'next/server';
import { supabaseAdmin, isRealSupabaseConfigured } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { slug, amount, secret } = await request.json();

    if (secret !== 'educalizando-force-balance-2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isRealSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    // 1. Get the store
    const { data: store, error: storeErr } = await supabaseAdmin
      .from('stores')
      .select('id, creator_id')
      .eq('slug', slug)
      .single();

    if (storeErr || !store) {
      return NextResponse.json({ error: 'Store not found', details: storeErr }, { status: 404 });
    }

    // 2. Insert transaction
    const tx = {
      id: `tx_manual_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      store_id: store.id,
      type: 'SALE',
      gross_amount: amount,
      net_amount: amount,
      platform_fee_amount: 0,
      asaas_fee_amount: 0,
      description: 'Saldo Adicionado Manualmente pelo Suporte',
      created_at: new Date().toISOString()
    };

    const { error: txErr } = await supabaseAdmin
      .from('wallet_transactions')
      .insert([tx]);

    if (txErr) {
      return NextResponse.json({ error: 'Failed to insert tx', details: txErr }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Added R$ ${amount} to store ${slug} successfully!` });

  } catch (err: any) {
    return NextResponse.json({ error: 'Server error', msg: err.message }, { status: 500 });
  }
}
