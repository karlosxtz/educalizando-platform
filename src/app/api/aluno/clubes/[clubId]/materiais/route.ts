import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ clubId: string }> }) {
  try {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: 'Faça login para acessar o clube.' }, { status: 401 });
    const { clubId } = await params;
    const { data: subscription } = await supabaseAdmin.from('creator_club_subscriptions').select('id,expires_at').eq('club_id', clubId).eq('student_id', user.id).eq('status', 'active').gt('expires_at', new Date().toISOString()).order('expires_at', { ascending: false }).limit(1).maybeSingle();
    if (!subscription) return NextResponse.json({ error: 'Sua assinatura ainda não está ativa ou já expirou.' }, { status: 403 });
    const { data: club, error: clubError } = await supabaseAdmin.from('creator_clubs').select('id,name,description,cover_url,club_type,store_id,stores(nome_loja,logo_url)').eq('id', clubId).maybeSingle();
    if (clubError) throw clubError;
    if (!club) return NextResponse.json({ error: 'Clube não encontrado.' }, { status: 404 });
    const { data: links, error } = await supabaseAdmin.from('creator_club_materials').select('product_id').eq('club_id', clubId);
    if (error) throw error;
    const ids = (links || []).map((item) => item.product_id);
    let productsQuery = supabaseAdmin.from('products').select('id,titulo,descricao,capa_url,tipo,page_count').in('id', ids).eq('store_id', club.store_id).eq('status', 'publicado').is('excluido_em', null);
    if (club.club_type === 'plr') productsQuery = productsQuery.eq('is_plr', true).eq('has_plr_delivery', true);
    const { data: products, error: productError } = ids.length ? await productsQuery : { data: [], error: null };
    if (productError) throw productError;
    return NextResponse.json({ club, subscription, products: products || [] });
  } catch (error) {
    console.error('[Student Club Materials] Falha:', error);
    return NextResponse.json({ error: 'Não foi possível carregar os materiais.' }, { status: 500 });
  }
}

