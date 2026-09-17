import { NextResponse } from 'next/server';
import { isSuperAdmin } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  if (!(await isSuperAdmin(request))) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  const { data, error } = await supabaseAdmin.from('reviews')
    .select('id,product_id,store_id,student_id,nota,comentario,status,created_at,products(titulo),stores(nome_loja)')
    .order('created_at', { ascending: false }).limit(500);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reviews: data || [] });
}

export async function PATCH(request: Request) {
  if (!(await isSuperAdmin(request))) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  const { id, status } = await request.json();
  if (typeof id !== 'string' || !['aprovado', 'oculto'].includes(status)) return NextResponse.json({ error: 'Avaliação ou status inválido.' }, { status: 400 });
  const { data, error } = await supabaseAdmin.from('reviews').update({ status }).eq('id', id).select('id,status').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, review: data });
}
