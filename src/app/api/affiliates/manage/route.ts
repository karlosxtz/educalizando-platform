import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function PUT(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  try {
    const { affiliateId, status } = await request.json();
    if (typeof affiliateId !== 'string' || !['aprovado', 'rejeitado'].includes(status)) {
      return NextResponse.json({ error: 'Afiliação ou status inválido.' }, { status: 400 });
    }
    const { data: affiliate, error: lookupError } = await supabaseAdmin
      .from('affiliates').select('id,store_id,status').eq('id', affiliateId).maybeSingle();
    if (lookupError) throw lookupError;
    if (!affiliate) return NextResponse.json({ error: 'Afiliação não encontrada.' }, { status: 404 });
    if (affiliate.status === 'cancelado') return NextResponse.json({ error: 'Uma afiliação cancelada não pode ser alterada pelo criador.' }, { status: 409 });

    const { data: store } = await supabaseAdmin.from('stores').select('id').eq('id', affiliate.store_id).eq('creator_id', user.id).maybeSingle();
    if (!store) return NextResponse.json({ error: 'Você não tem permissão para gerenciar esta afiliação.' }, { status: 403 });
    const { data, error } = await supabaseAdmin.from('affiliates')
      .update({ status, updated_at: new Date().toISOString() }).eq('id', affiliate.id).select('id,status').single();
    if (error) throw error;
    return NextResponse.json({ success: true, affiliate: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Não foi possível atualizar a afiliação.' }, { status: 500 });
  }
}
