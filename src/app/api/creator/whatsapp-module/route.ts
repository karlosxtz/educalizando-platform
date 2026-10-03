import { getRequestUser } from '@/lib/api-auth';
import { creatorWhatsAppInstanceName,resolveCreatorWhatsAppAccess } from '@/lib/creator-whatsapp-access';
import { createInfinitePayCheckout,isValidCPF } from '@/lib/infinitepay-service';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
  const user = await getRequestUser(request); if (!user) return NextResponse.json({ error: 'Faça login.' }, { status: 401 });
  const { data: store } = await supabaseAdmin.from('stores').select('id,nome_loja,slug').eq('creator_id', user.id).maybeSingle();
  if (!store) return NextResponse.json({ error: 'Loja não encontrada.' }, { status: 404 });
  const access = await resolveCreatorWhatsAppAccess(store.id);
  return NextResponse.json({
    store,
    subscription: access.subscription ? { ...access.subscription, active: access.active } : null,
    access: {
      active: access.active,
      source: access.source,
      chargeEnabled: access.chargeEnabled,
      paidActive: access.paidActive,
      individualFree: access.individualFree,
    },
    priceCents: access.priceCents,
  });
  } catch (error) { console.error('[WhatsApp Module]', error); return NextResponse.json({ error: 'O módulo está sendo preparado. Tente novamente em instantes.' }, { status: 503 }); }
}
export async function POST(request: Request) {
  try {
  const user = await getRequestUser(request); if (!user?.email) return NextResponse.json({ error: 'Faça login.' }, { status: 401 });
  const cpf = String(user.user_metadata?.cpf || '').replace(/\D/g, ''); if (!isValidCPF(cpf)) return NextResponse.json({ error: 'Complete um CPF válido na sua conta antes de continuar.' }, { status: 400 });
  const { data: store } = await supabaseAdmin.from('stores').select('id,nome_loja,slug,whatsapp').eq('creator_id', user.id).maybeSingle();
  if (!store) return NextResponse.json({ error: 'Loja não encontrada.' }, { status: 404 });
  const access = await resolveCreatorWhatsAppAccess(store.id);
  if (access.active) {
    return NextResponse.json({ error: 'O módulo já está liberado para esta loja. Atualize a página para conectar seu WhatsApp.' }, { status: 409 });
  }
  if (!access.chargeEnabled) {
    return NextResponse.json({ error: 'A cobrança está desativada e o módulo já pode ser usado gratuitamente.' }, { status: 409 });
  }
  const orderNsu = `wamod_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const origin = new URL(request.url).origin;
  const checkout = await createInfinitePayCheckout({ orderNsu, redirectUrl: `${origin}/dashboard/whatsapp-loja?pagamento=processando`, webhookUrl: `${origin}/api/webhooks/infinitepay`, customer: { name: user.user_metadata?.full_name || store.nome_loja, email: user.email, phoneNumber: store.whatsapp || undefined }, items: [{ quantity: 1, price: access.priceCents, description: 'WhatsApp da Loja — 30 dias' }] });
  const instanceName = creatorWhatsAppInstanceName(store);
  const { error } = await supabaseAdmin.from('whatsapp_store_subscriptions').upsert({ store_id: store.id, creator_id: user.id, status: 'pending', amount_cents: access.priceCents, order_nsu: orderNsu, checkout_url: checkout.checkoutUrl, instance_name: instanceName, updated_at: new Date().toISOString() }, { onConflict: 'store_id' });
  if (error) throw error;
  return NextResponse.json({ checkoutUrl: checkout.checkoutUrl });
  } catch (error) { console.error('[WhatsApp Module]', error); return NextResponse.json({ error: 'Não foi possível preparar o pagamento agora. Tente novamente em instantes.' }, { status: 503 }); }
}
