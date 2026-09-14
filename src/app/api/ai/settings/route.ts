import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';

async function getOwnedStore(request: Request, storeId: string) {
  const user = await getRequestUser(request);
  if (!user) return { user: null, store: null };
  const { data: store } = await supabaseAdmin
    .from('stores')
    .select('id')
    .eq('id', storeId)
    .eq('creator_id', user.id)
    .maybeSingle();
  return { user, store };
}

export async function GET(request: Request) {
  const storeId = new URL(request.url).searchParams.get('storeId') || '';
  const { user, store } = await getOwnedStore(request, storeId);
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  if (!store) return NextResponse.json({ error: 'Loja não encontrada ou sem permissão.' }, { status: 403 });

  const { data } = await supabaseAdmin.from('store_secrets').select('google_ai_key').eq('store_id', storeId).maybeSingle();
  return NextResponse.json({ apiKey: data?.google_ai_key || '' });
}

export async function PUT(request: Request) {
  const { storeId, apiKey } = await request.json();
  const { user, store } = await getOwnedStore(request, String(storeId || ''));
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  if (!store) return NextResponse.json({ error: 'Loja não encontrada ou sem permissão.' }, { status: 403 });

  const cleanKey = String(apiKey || '').trim().replace(/['"]/g, '');
  if (!cleanKey) return NextResponse.json({ error: 'Informe uma chave válida.' }, { status: 400 });

  const { error } = await supabaseAdmin.from('store_secrets').upsert({ store_id: storeId, google_ai_key: cleanKey }, { onConflict: 'store_id' });
  if (error) return NextResponse.json({ error: 'Não foi possível salvar a chave.' }, { status: 500 });
  return NextResponse.json({ success: true });
}

