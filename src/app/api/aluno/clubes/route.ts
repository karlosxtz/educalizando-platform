import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: 'Faça login para ver seus clubes.' }, { status: 401 });
    const { data, error } = await supabaseAdmin.from('creator_club_subscriptions')
      .select('id,club_id,status,starts_at,expires_at,created_at,club:creator_clubs(id,name,slug,description,cover_url,monthly_price,store_id,stores(nome_loja,logo_url))')
      .eq('student_id', user.id).order('created_at', { ascending: false });
    if (error) throw error;
    const unique = new Map<string, unknown>();
    for (const item of data || []) if (!unique.has(item.club_id)) unique.set(item.club_id, item);
    return NextResponse.json({ subscriptions: [...unique.values()], serverNow: new Date().toISOString() });
  } catch (error) {
    console.error('[Student Clubs] Falha:', error);
    return NextResponse.json({ error: 'Não foi possível carregar seus clubes.' }, { status: 500 });
  }
}

