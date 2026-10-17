import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';

/** Restore against a live owned record; a cached/offline product must never become the save baseline. */
export async function GET(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const storeId = params.get('storeId'), productId = params.get('productId');
  if (!storeId || !productId) return NextResponse.json({ error: 'Selecione a loja e o material.' }, { status: 400 });
  const { data: store, error: storeError } = await supabaseAdmin.from('stores').select('id').eq('id', storeId).eq('creator_id', user.id).maybeSingle();
  if (storeError) return NextResponse.json({ error: 'Não foi possível conferir a loja agora.' }, { status: 503 });
  if (!store) return NextResponse.json({ error: 'Loja não encontrada ou sem permissão.' }, { status: 403 });
  const { data: product, error } = await supabaseAdmin.from('products').select('id,store_id,titulo,descricao,plr_descricao,tipo,capa_url,status,is_plr,tags,seasonal_tags,category_id,education_level_id,category_ids,education_level_ids,age_range,format_details,page_count,updated_at,preco,preco_plr,preco_original,is_free').eq('id', productId).eq('store_id', storeId).eq('status', 'publicado').is('excluido_em', null).maybeSingle();
  if (error) return NextResponse.json({ error: 'Não foi possível carregar o cadastro atual. O rascunho continua guardado.' }, { status: 503 });
  if (!product) return NextResponse.json({ error: 'Este material não está publicado nesta loja.' }, { status: 404 });
  return NextResponse.json({ product }, { headers: { 'Cache-Control': 'private, no-store' } });
}
