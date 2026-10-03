import { getRequestUser } from '@/lib/api-auth';
import { ensureCreatorWhatsAppSubscription,resolveCreatorWhatsAppAccess } from '@/lib/creator-whatsapp-access';
import { supabaseAdmin } from '@/lib/supabase';
import { getEvolutionConnectionQrCodeForInstance } from '@/lib/whatsapp-notification-service';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: 'Faça login para conectar seu WhatsApp.' }, { status: 401 });

    const { data: store } = await supabaseAdmin.from('stores').select('id,slug,creator_id').eq('creator_id', user.id).maybeSingle();
    if (!store) return NextResponse.json({ error: 'Loja não encontrada.' }, { status: 404 });
    const access = await resolveCreatorWhatsAppAccess(store.id);
    if (!access.active) return NextResponse.json({ error: 'Ative o módulo antes de conectar o seu WhatsApp.' }, { status: 403 });
    const subscription = await ensureCreatorWhatsAppSubscription({ storeId: store.id, creatorId: store.creator_id, slug: store.slug, priceCents: access.priceCents });
    if (!subscription.instance_name || !subscription.id) return NextResponse.json({ error: 'Não foi possível preparar a instância desta loja.' }, { status: 503 });

    const body = await request.json().catch(() => ({}));
    const origin = new URL(request.url).origin;
    const result = await getEvolutionConnectionQrCodeForInstance(subscription.instance_name, Boolean(body.force), `${origin}/api/webhooks/whatsapp-store`);
    if (result.connected) {
      await supabaseAdmin.from('whatsapp_store_subscriptions').update({ whatsapp_connected: true, updated_at: new Date().toISOString() }).eq('id', subscription.id);
    }
    if (result.error && !result.qrCode && !result.connected) return NextResponse.json({ error: result.error, connection: result }, { status: 503 });
    return NextResponse.json({ success: true, connection: result });
  } catch (error) {
    console.error('[WhatsApp Module Connection]', error);
    return NextResponse.json({ error: 'Não foi possível preparar a conexão agora. Tente novamente.' }, { status: 503 });
  }
}
