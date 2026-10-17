import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/api-auth';
import { generateAiContent, getAiKey } from '@/lib/ai-provider';
import { extractAiJson } from '@/lib/ai-json';
import { supabaseAdmin } from '@/lib/supabase';
import { consumeRequestRateLimit, rateLimitResponse } from '@/lib/request-rate-limit';

export async function POST(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const { storeId } = await request.json().catch(() => ({}));
  if (!storeId || typeof storeId !== 'string') return NextResponse.json({ error: 'Selecione uma loja válida.' }, { status: 400 });
  const { data: store, error } = await supabaseAdmin.from('stores').select('id').eq('id', storeId).eq('creator_id', user.id).maybeSingle();
  if (error) return NextResponse.json({ error: 'Não foi possível verificar a loja.' }, { status: 503 });
  if (!store) return NextResponse.json({ error: 'Loja não encontrada ou sem permissão.' }, { status: 403 });
  const rate = await consumeRequestRateLimit(request, { namespace: `ai-health:${user.id}`, limit: 3, windowMs: 60_000 });
  if (!rate.allowed) return rateLimitResponse(rate);
  const { data: secret } = await supabaseAdmin.from('store_secrets').select('google_ai_key,openrouter_ai_key,ai_provider').eq('store_id', storeId).maybeSingle();
  if (!secret || !getAiKey(secret).key) return NextResponse.json({ error: 'Salve uma chave de IA antes de testar a conexão.' }, { status: 400 });
  const start = Date.now();
  try {
    const response = extractAiJson(await generateAiContent(secret, 'Teste de conexão. Responda somente com o objeto JSON {"status":"ok"}.', true, { maxTokens: 512 }));
    if (response?.status !== 'ok') return NextResponse.json({ error: 'O provedor respondeu, mas não confirmou o formato solicitado. Tente novamente.' }, { status: 502 });
    return NextResponse.json({ ok: true, elapsedMs: Date.now() - start });
  } catch (caught) {
    return NextResponse.json({ error: caught instanceof Error ? caught.message : 'Não foi possível testar a IA agora.' }, { status: 502 });
  }
}
