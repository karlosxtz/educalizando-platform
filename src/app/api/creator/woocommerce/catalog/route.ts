import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { listWooProductsForReview } from '@/lib/woocommerce-service';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: 'Faça login como criador.' }, { status: 401 });

    const { data: store } = await supabaseAdmin.from('stores').select('id').eq('creator_id', user.id).maybeSingle();
    if (!store) return NextResponse.json({ error: 'Loja não encontrada.' }, { status: 404 });

    const { data: integration, error } = await supabaseAdmin.from('woocommerce_integrations').select('*').eq('store_id', store.id).maybeSingle();
    if (error) throw error;
    if (!integration) return NextResponse.json({ error: 'Conecte uma loja WooCommerce primeiro.' }, { status: 409 });
    if (integration.status !== 'active') return NextResponse.json({ error: 'A integração está pausada.' }, { status: 409 });

    const products = await listWooProductsForReview(integration);
    return NextResponse.json({ products });
  } catch (error) {
    console.error('[WooCommerce catalog]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Não foi possível carregar os produtos.' }, { status: 503 });
  }
}
