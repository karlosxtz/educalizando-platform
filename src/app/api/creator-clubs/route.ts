import { getRequestUser } from '@/lib/api-auth';
import { creatorClubSlug } from '@/lib/creator-club';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';

async function context(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return null;
  const { data: store } = await supabaseAdmin.from('stores').select('id,nome_loja,slug').eq('creator_id', user.id).maybeSingle();
  return store ? { user, store } : null;
}

export async function GET(request: Request) {
  try {
    const ctx = await context(request);
    if (!ctx) return NextResponse.json({ error: 'Entre como criador para configurar seus clubes.' }, { status: 401 });
    const [{ data: clubs, error: clubsError }, { data: products, error: productError }] = await Promise.all([
      supabaseAdmin.from('creator_clubs').select('*').eq('store_id', ctx.store.id).order('created_at', { ascending: false }),
      supabaseAdmin.from('products').select('id,titulo,capa_url,status').eq('store_id', ctx.store.id).eq('status', 'publicado').is('excluido_em', null).order('created_at', { ascending: false }).limit(2000),
    ]);
    if (clubsError || productError) throw clubsError || productError;
    const clubIds = (clubs || []).map((club) => club.id);
    const [{ data: materials, error: materialError }, { data: payments, error: paymentError }] = clubIds.length
      ? await Promise.all([
          supabaseAdmin.from('creator_club_materials').select('club_id,product_id').in('club_id', clubIds),
          supabaseAdmin.from('creator_club_payments').select('club_id,status').in('club_id', clubIds),
        ])
      : [{ data: [], error: null }, { data: [], error: null }];
    if (materialError || paymentError) throw materialError || paymentError;
    const selectedProductIdsByClub = Object.fromEntries(clubIds.map((clubId) => [clubId, (materials || []).filter((item) => item.club_id === clubId).map((item) => item.product_id)]));
    const enrichedClubs = (clubs || []).map((club) => ({ ...club, material_count: selectedProductIdsByClub[club.id]?.length || 0, paid_sales_count: (payments || []).filter((item) => item.club_id === club.id && item.status === 'paid').length }));
    return NextResponse.json({ clubs: enrichedClubs, products: products || [], selectedProductIdsByClub, store: ctx.store });
  } catch (error) {
    console.error('[Creator Clubs] Falha ao carregar:', error);
    return NextResponse.json({ error: 'Não foi possível carregar os clubes. Verifique se a atualização do banco foi aplicada.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const ctx = await context(request);
    if (!ctx) return NextResponse.json({ error: 'Entre como criador para configurar seus clubes.' }, { status: 401 });
    const body = await request.json() as Record<string, unknown>;
    const id = typeof body.id === 'string' ? body.id : '';
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 100) : '';
    const description = typeof body.description === 'string' ? body.description.trim().slice(0, 3000) : '';
    const coverUrl = typeof body.coverUrl === 'string' ? body.coverUrl.trim().slice(0, 2000) : '';
    const monthlyPrice = Number(body.monthlyPrice);
    const status = body.status === 'published' ? 'published' : 'draft';
    const productIds = Array.isArray(body.productIds) ? [...new Set(body.productIds.filter((productId): productId is string => typeof productId === 'string'))] : [];
    if (name.length < 3) return NextResponse.json({ error: 'Informe um nome com pelo menos 3 caracteres.' }, { status: 400 });
    if (!Number.isFinite(monthlyPrice) || monthlyPrice < 1) return NextResponse.json({ error: 'A mensalidade mínima é R$ 1,00.' }, { status: 400 });
    if (coverUrl && !/^https:\/\//i.test(coverUrl)) return NextResponse.json({ error: 'A capa precisa ter uma URL HTTPS válida.' }, { status: 400 });
    if (status === 'published' && productIds.length === 0) return NextResponse.json({ error: 'Adicione pelo menos um material antes de publicar.' }, { status: 400 });
    const { data: validProducts, error: productsError } = productIds.length ? await supabaseAdmin.from('products').select('id').eq('store_id', ctx.store.id).eq('status', 'publicado').in('id', productIds).is('excluido_em', null) : { data: [], error: null };
    if (productsError) throw productsError;
    if ((validProducts || []).length !== productIds.length) return NextResponse.json({ error: 'Um dos materiais não pertence à sua loja ou ainda não está publicado.' }, { status: 400 });

    let existing: { id: string; slug: string } | null = null;
    if (id) {
      const result = await supabaseAdmin.from('creator_clubs').select('id,slug').eq('id', id).eq('store_id', ctx.store.id).maybeSingle();
      if (result.error) throw result.error;
      existing = result.data;
      if (!existing) return NextResponse.json({ error: 'Clube não encontrado.' }, { status: 404 });
    }
    const slug = existing?.slug || `${creatorClubSlug(`${ctx.store.slug || ctx.store.nome_loja}-${name}`)}-${randomUUID().slice(0, 6)}`;
    const payload = { store_id: ctx.store.id, creator_id: ctx.user.id, name, slug, description, cover_url: coverUrl || null, monthly_price: Number(monthlyPrice.toFixed(2)), status, updated_at: new Date().toISOString() };
    const clubResult = existing
      ? await supabaseAdmin.from('creator_clubs').update(payload).eq('id', existing.id).eq('store_id', ctx.store.id).select('*').single()
      : await supabaseAdmin.from('creator_clubs').insert(payload).select('*').single();
    if (clubResult.error) throw clubResult.error;
    const club = clubResult.data;
    const { error: deleteError } = await supabaseAdmin.from('creator_club_materials').delete().eq('club_id', club.id);
    if (deleteError) throw deleteError;
    if (productIds.length) {
      const { error: insertError } = await supabaseAdmin.from('creator_club_materials').insert(productIds.map((productId) => ({ club_id: club.id, product_id: productId })));
      if (insertError) throw insertError;
    }
    return NextResponse.json({ success: true, club, selectedProductIds: productIds });
  } catch (error) {
    console.error('[Creator Clubs] Falha ao salvar:', error);
    return NextResponse.json({ error: 'Não foi possível salvar o clube agora.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const ctx = await context(request);
    if (!ctx) return NextResponse.json({ error: 'Entre como criador para excluir um clube.' }, { status: 401 });
    const id = new URL(request.url).searchParams.get('id') || '';
    const { data: club, error } = await supabaseAdmin.from('creator_clubs').select('id').eq('id', id).eq('store_id', ctx.store.id).maybeSingle();
    if (error) throw error;
    if (!club) return NextResponse.json({ error: 'Clube não encontrado.' }, { status: 404 });
    const { count, error: paidError } = await supabaseAdmin.from('creator_club_payments').select('id', { count: 'exact', head: true }).eq('club_id', id).eq('status', 'paid');
    if (paidError) throw paidError;
    if ((count || 0) > 0) {
      const { error: archiveError } = await supabaseAdmin.from('creator_clubs').update({ status: 'archived', updated_at: new Date().toISOString() }).eq('id', id);
      if (archiveError) throw archiveError;
      return NextResponse.json({ success: true, archived: true, message: 'O clube possui vendas e foi arquivado para preservar assinaturas e registros financeiros.' });
    }
    const { error: paymentDeleteError } = await supabaseAdmin.from('creator_club_payments').delete().eq('club_id', id);
    if (paymentDeleteError) throw paymentDeleteError;
    const { error: subscriptionDeleteError } = await supabaseAdmin.from('creator_club_subscriptions').delete().eq('club_id', id);
    if (subscriptionDeleteError) throw subscriptionDeleteError;
    const { error: deleteError } = await supabaseAdmin.from('creator_clubs').delete().eq('id', id).eq('store_id', ctx.store.id);
    if (deleteError) throw deleteError;
    return NextResponse.json({ success: true, archived: false, message: 'Clube excluído definitivamente.' });
  } catch (error) {
    console.error('[Creator Clubs] Falha ao excluir:', error);
    return NextResponse.json({ error: 'Não foi possível excluir este clube agora.' }, { status: 500 });
  }
}

