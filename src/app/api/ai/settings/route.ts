import { getAiKey } from '@/lib/ai-provider';
import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

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

  const { data } = await supabaseAdmin.from('store_secrets').select('google_ai_key, openrouter_ai_key, ai_provider').eq('store_id', storeId).maybeSingle();
  return NextResponse.json({ configured: Boolean(data && getAiKey(data).key) });
}

export async function PUT(request: Request) {
  const { storeId, apiKey } = await request.json();
  const { user, store } = await getOwnedStore(request, String(storeId || ''));
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  if (!store) return NextResponse.json({ error: 'Loja não encontrada ou sem permissão.' }, { status: 403 });

  const cleanKey = String(apiKey || '').trim().replace(/['"]/g, '').replace(/^Bearer\s+/i, '');
  if (!cleanKey) return NextResponse.json({ error: 'Informe uma chave válida.' }, { status: 400 });

  const isGoogleKey = cleanKey.startsWith('AIza');
  const secrets = isGoogleKey
    ? { store_id: storeId, google_ai_key: cleanKey, ai_provider: 'primary' }
    : { store_id: storeId, openrouter_ai_key: cleanKey, ai_provider: 'alternative' };
  const { error } = await supabaseAdmin.from('store_secrets').upsert(secrets as any, { onConflict: 'store_id' });
  if (error) return NextResponse.json({ error: 'Não foi possível salvar a chave.' }, { status: 500 });
  return NextResponse.json({ success: true });
}
