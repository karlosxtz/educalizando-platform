import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/api-auth';
import { creatorClubSlug } from '@/lib/creator-club';
import { supabaseAdmin } from '@/lib/supabase';

async function context(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return null;
  const { data: store } = await supabaseAdmin.from('stores').select('id,nome_loja,slug').eq('creator_id', user.id).maybeSingle();
  return store ? { user, store } : null;
}

export async function GET(request: Request) {
  try {
    const ctx = await context(request);
    if (!ctx) return NextResponse.json({ error: 'Entre como criador para configurar seu clube.' }, { status: 401 });
    const [{ data: club, error: clubError }, { data: products, error: productError }] = await Promise.all([
      supabaseAdmin.from('creator_clubs').select('*').eq('store_id', ctx.store.id).maybeSingle(),
      supabaseAdmin.from('products').select('id,titulo,capa_url,status').eq('store_id', ctx.store.id).eq('status', 'publicado').is('excluido_em', null).order('created_at', { ascending: false }).limit(2000),
    ]);
    if (clubError || productError) throw clubError || productError;
    let selectedProductIds: string[] = [];
    if (club) {
      const { data, error } = await supabaseAdmin.from('creator_club_materials').select('product_id').eq('club_id', club.id);
      if (error) throw error;
      selectedProductIds = (data || []).map((item) => item.product_id);
    }
    return NextResponse.json({ club, products: products || [], selectedProductIds, store: ctx.store });
  } catch (error) {
    console.error('[Creator Club] Falha ao carregar:', error);
    return NextResponse.json({ error: 'Não foi possível carregar o clube. Verifique se a atualização do banco foi aplicada.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const ctx = await context(request);
    if (!ctx) return NextResponse.json({ error: 'Entre como criador para configurar seu clube.' }, { status: 401 });
    const body = await request.json() as Record<string, unknown>;
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 100) : '';
    const description = typeof body.description === 'string' ? body.description.trim().slice(0, 3000) : '';
    const coverUrl = typeof body.coverUrl === 'string' ? body.coverUrl.trim().slice(0, 2000) : '';
    const monthlyPrice = Number(body.monthlyPrice);
    const status = body.status === 'published' ? 'published' : 'draft';
    const productIds = Array.isArray(body.productIds) ? [...new Set(body.productIds.filter((id): id is string => typeof id === 'string'))] : [];
    if (name.length < 3) return NextResponse.json({ error: 'Informe um nome com pelo menos 3 caracteres.' }, { status: 400 });
    if (!Number.isFinite(monthlyPrice) || monthlyPrice < 1) return NextResponse.json({ error: 'A mensalidade mínima é R$ 1,00.' }, { status: 400 });
    if (coverUrl && !/^https:\/\//i.test(coverUrl)) return NextResponse.json({ error: 'A capa precisa ter uma URL HTTPS válida.' }, { status: 400 });
    if (status === 'published' && productIds.length === 0) return NextResponse.json({ error: 'Adicione pelo menos um material antes de publicar.' }, { status: 400 });

    const { data: validProducts, error: productsError } = productIds.length ? await supabaseAdmin.from('products').select('id').eq('store_id', ctx.store.id).eq('status', 'publicado').in('id', productIds).is('excluido_em', null) : { data: [], error: null };
    if (productsError) throw productsError;
    if ((validProducts || []).length !== productIds.length) return NextResponse.json({ error: 'Um dos materiais não pertence à sua loja ou ainda não está publicado.' }, { status: 400 });

    const baseSlug = creatorClubSlug(`${ctx.store.slug || ctx.store.nome_loja}-clube`);
    const { data: existing } = await supabaseAdmin.from('creator_clubs').select('id,slug').eq('store_id', ctx.store.id).maybeSingle();
    const { data: club, error: clubError } = await supabaseAdmin.from('creator_clubs').upsert({
      ...(existing?.id ? { id: existing.id } : {}), store_id: ctx.store.id, creator_id: ctx.user.id,
      name, slug: existing?.slug || baseSlug, description, cover_url: coverUrl || null,
      monthly_price: Number(monthlyPrice.toFixed(2)), status, updated_at: new Date().toISOString(),
    }, { onConflict: 'store_id' }).select('*').single();
    if (clubError) throw clubError;
    const { error: deleteError } = await supabaseAdmin.from('creator_club_materials').delete().eq('club_id', club.id);
    if (deleteError) throw deleteError;
    if (productIds.length) {
      const { error: insertError } = await supabaseAdmin.from('creator_club_materials').insert(productIds.map((productId) => ({ club_id: club.id, product_id: productId })));
      if (insertError) throw insertError;
    }
    return NextResponse.json({ success: true, club, selectedProductIds: productIds });
  } catch (error) {
    console.error('[Creator Club] Falha ao salvar:', error);
    return NextResponse.json({ error: 'Não foi possível salvar o clube agora.' }, { status: 500 });
  }
}

