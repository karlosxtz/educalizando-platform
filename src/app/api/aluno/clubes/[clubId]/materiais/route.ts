import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request, { params }: { params: Promise<{ clubId: string }> }) {
  try {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: 'Faça login para acessar o clube.' }, { status: 401 });
    const { clubId } = await params;
    const { data: subscription } = await supabaseAdmin.from('creator_club_subscriptions').select('id,expires_at').eq('club_id', clubId).eq('student_id', user.id).eq('status', 'active').gt('expires_at', new Date().toISOString()).order('expires_at', { ascending: false }).limit(1).maybeSingle();
    if (!subscription) return NextResponse.json({ error: 'Sua assinatura ainda não está ativa ou já expirou.' }, { status: 403 });
    const { data: club } = await supabaseAdmin.from('creator_clubs').select('id,name,description,cover_url,stores(nome_loja,logo_url)').eq('id', clubId).maybeSingle();
    const { data: links, error } = await supabaseAdmin.from('creator_club_materials').select('product_id').eq('club_id', clubId);
    if (error) throw error;
    const ids = (links || []).map((item) => item.product_id);
    const { data: products, error: productError } = ids.length ? await supabaseAdmin.from('products').select('id,titulo,descricao,capa_url,tipo,page_count').in('id', ids).eq('status', 'publicado').is('excluido_em', null) : { data: [], error: null };
    if (productError) throw productError;
    return NextResponse.json({ club, subscription, products: products || [] });
  } catch (error) {
    console.error('[Student Club Materials] Falha:', error);
    return NextResponse.json({ error: 'Não foi possível carregar os materiais.' }, { status: 500 });
  }
}

