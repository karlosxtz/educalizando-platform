import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';

/** Retorna somente ao criador as entregas privadas da própria loja. */
export async function GET(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  const storeId = new URL(request.url).searchParams.get('storeId')?.trim();
  if (!storeId) return NextResponse.json({ error: 'Loja não informada.' }, { status: 400 });

  const { data: store } = await supabaseAdmin
    .from('stores')
    .select('id')
    .eq('id', storeId)
    .eq('creator_id', user.id)
    .maybeSingle();
  if (!store) return NextResponse.json({ error: 'Você não pode acessar as entregas desta loja.' }, { status: 403 });

  const { data: products, error: productsError } = await supabaseAdmin
    .from('products')
    .select('id, titulo')
    .eq('store_id', storeId)
    .is('excluido_em', null);
  if (productsError) return NextResponse.json({ error: productsError.message }, { status: 500 });

  const productIds = (products || []).map(product => product.id);
  if (!productIds.length) return NextResponse.json({ deliveries: [] });

  const { data: rows, error } = await supabaseAdmin
    .from('product_deliveries')
    .select('product_id, arquivo_url, arquivo_nome, updated_at')
    .in('product_id', productIds)
    .not('arquivo_url', 'is', null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const titleByProduct = new Map((products || []).map(product => [product.id, product.titulo]));
  return NextResponse.json({
    deliveries: (rows || [])
      .filter(row => typeof row.arquivo_url === 'string' && row.arquivo_url.trim())
      .map(row => ({
        productId: row.product_id,
        productTitle: titleByProduct.get(row.product_id) || 'Produto',
        url: row.arquivo_url,
        fileName: row.arquivo_nome || null,
        updatedAt: row.updated_at || null
      }))
  });
}
