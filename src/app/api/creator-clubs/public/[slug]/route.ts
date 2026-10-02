import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const { data: club, error } = await supabaseAdmin.from('creator_clubs')
      .select('id,name,slug,description,cover_url,monthly_price,store_id,stores(nome_loja,slug,logo_url)')
      .eq('slug', slug).eq('status', 'published').maybeSingle();
    if (error) throw error;
    if (!club) return NextResponse.json({ error: 'Clube não encontrado.' }, { status: 404 });
    const { data: links, error: linksError } = await supabaseAdmin.from('creator_club_materials').select('product_id').eq('club_id', club.id);
    if (linksError) throw linksError;
    const ids = (links || []).map((item) => item.product_id);
    const { data: products, error: productsError } = ids.length
      ? await supabaseAdmin.from('products').select('id,titulo,capa_url,tipo').in('id', ids).eq('status', 'publicado').is('excluido_em', null)
      : { data: [], error: null };
    if (productsError) throw productsError;
    return NextResponse.json({ club, products: products || [] });
  } catch (error) {
    console.error('[Creator Club Public] Falha:', error);
    return NextResponse.json({ error: 'Não foi possível carregar este clube.' }, { status: 500 });
  }
}

