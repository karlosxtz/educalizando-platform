import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data } = await supabaseAdmin.from('stores').select('id,slug,nome_loja,logo_url,exclusive_material_requests_enabled').eq('slug', slug).maybeSingle();
  if (!data || !data.exclusive_material_requests_enabled) return NextResponse.json({ error: 'Esta loja não está recebendo solicitações.' }, { status: 404 });
  return NextResponse.json({ store: data });
}
