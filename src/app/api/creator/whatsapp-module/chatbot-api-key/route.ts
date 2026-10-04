import { getRequestUser } from '@/lib/api-auth';
import { resolveCreatorWhatsAppAccess } from '@/lib/creator-whatsapp-access';
import { createStoreChatbotApiKey } from '@/lib/store-chatbot-api';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

async function creatorContext(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return null;
  const { data: store, error } = await supabaseAdmin
    .from('stores')
    .select('id,creator_id,nome_loja,slug')
    .eq('creator_id', user.id)
    .maybeSingle();
  if (error) throw error;
  return store ? { user, store } : null;
}

function endpoint(request: Request) {
  return `${new URL(request.url).origin}/api/integrations/store-chatbot`;
}

export async function GET(request: Request) {
  try {
    const context = await creatorContext(request);
    if (!context) return NextResponse.json({ error: 'Entre como criador para gerenciar a integração.' }, { status: 401 });
    const [access, keyResult] = await Promise.all([
      resolveCreatorWhatsAppAccess(context.store.id),
      supabaseAdmin.from('store_chatbot_api_keys')
        .select('key_prefix,last_four,created_at,updated_at,last_used_at,revoked_at')
        .eq('store_id', context.store.id)
        .maybeSingle(),
    ]);
    if (keyResult.error) throw keyResult.error;
    const record = keyResult.data;
    return NextResponse.json({
      endpoint: endpoint(request),
      access: { active: access.active, source: access.source },
      key: record && !record.revoked_at ? {
        exists: true,
        masked: `${record.key_prefix}••••••••${record.last_four}`,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
        lastUsedAt: record.last_used_at,
      } : { exists: false },
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[Store Chatbot API Key] Falha ao carregar:', error);
    return NextResponse.json({ error: 'Não foi possível carregar a integração. Verifique se a atualização do banco foi aplicada.' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const context = await creatorContext(request);
    if (!context) return NextResponse.json({ error: 'Entre como criador para gerar sua chave.' }, { status: 401 });
    const access = await resolveCreatorWhatsAppAccess(context.store.id);
    if (!access.active) return NextResponse.json({ error: 'Ative o módulo para gerar e utilizar a API privada da sua loja.' }, { status: 403 });

    const generated = createStoreChatbotApiKey();
    const now = new Date().toISOString();
    const { error } = await supabaseAdmin.from('store_chatbot_api_keys').upsert({
      store_id: context.store.id,
      creator_id: context.user.id,
      key_hash: generated.hash,
      key_prefix: generated.prefix,
      last_four: generated.lastFour,
      created_at: now,
      updated_at: now,
      last_used_at: null,
      revoked_at: null,
    }, { onConflict: 'store_id' });
    if (error) throw error;
    return NextResponse.json({
      success: true,
      apiKey: generated.key,
      endpoint: endpoint(request),
      warning: 'Copie esta chave agora. Por segurança, ela não será exibida novamente.',
    }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[Store Chatbot API Key] Falha ao gerar:', error);
    return NextResponse.json({ error: 'Não foi possível gerar a chave. Verifique se a atualização do banco foi aplicada.' }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  try {
    const context = await creatorContext(request);
    if (!context) return NextResponse.json({ error: 'Entre como criador para revogar sua chave.' }, { status: 401 });
    const now = new Date().toISOString();
    const { error } = await supabaseAdmin.from('store_chatbot_api_keys')
      .update({ revoked_at: now, updated_at: now })
      .eq('store_id', context.store.id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Store Chatbot API Key] Falha ao revogar:', error);
    return NextResponse.json({ error: 'Não foi possível revogar a chave agora.' }, { status: 503 });
  }
}
