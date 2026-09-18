import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/api-auth';
import { createInfinitePayCheckout, isValidCPF } from '@/lib/infinitepay-service';
import { supabaseAdmin } from '@/lib/supabase';

const PRICE_CENTS = 1990;
export async function GET(request: Request) {
  try {
  const user = await getRequestUser(request); if (!user) return NextResponse.json({ error: 'Faça login.' }, { status: 401 });
  const { data: store } = await supabaseAdmin.from('stores').select('id,nome_loja,slug').eq('creator_id', user.id).maybeSingle();
  if (!store) return NextResponse.json({ error: 'Loja não encontrada.' }, { status: 404 });
  const { data: subscription } = await supabaseAdmin.from('whatsapp_store_subscriptions').select('*').eq('store_id', store.id).maybeSingle();
  const active = Boolean(subscription?.status === 'active' && subscription.expires_at && new Date(subscription.expires_at) > new Date());
  return NextResponse.json({ store, subscription: subscription ? { ...subscription, active } : null, priceCents: PRICE_CENTS });
  } catch (error) { console.error('[WhatsApp Module]', error); return NextResponse.json({ error: 'O módulo está sendo preparado. Tente novamente em instantes.' }, { status: 503 }); }
}
export async function POST(request: Request) {
  try {
  const user = await getRequestUser(request); if (!user?.email) return NextResponse.json({ error: 'Faça login.' }, { status: 401 });
  const cpf = String(user.user_metadata?.cpf || '').replace(/\D/g, ''); if (!isValidCPF(cpf)) return NextResponse.json({ error: 'Complete um CPF válido na sua conta antes de continuar.' }, { status: 400 });
  const { data: store } = await supabaseAdmin.from('stores').select('id,nome_loja,slug,whatsapp').eq('creator_id', user.id).maybeSingle();
  if (!store) return NextResponse.json({ error: 'Loja não encontrada.' }, { status: 404 });
  const orderNsu = `wamod_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const origin = new URL(request.url).origin;
  const checkout = await createInfinitePayCheckout({ orderNsu, redirectUrl: `${origin}/dashboard/whatsapp-loja?pagamento=processando`, webhookUrl: `${origin}/api/webhooks/infinitepay`, customer: { name: user.user_metadata?.full_name || store.nome_loja, email: user.email, phoneNumber: store.whatsapp || undefined }, items: [{ quantity: 1, price: PRICE_CENTS, description: 'WhatsApp da Loja — 30 dias' }] });
  const instanceName = `${store.slug.replace(/[^a-z0-9-]/gi, '-').toLowerCase().slice(0, 36)}-${store.id.slice(0, 6)}`;
  const { error } = await supabaseAdmin.from('whatsapp_store_subscriptions').upsert({ store_id: store.id, creator_id: user.id, status: 'pending', amount_cents: PRICE_CENTS, order_nsu: orderNsu, checkout_url: checkout.checkoutUrl, instance_name: instanceName, updated_at: new Date().toISOString() }, { onConflict: 'store_id' });
  if (error) throw error;
  return NextResponse.json({ checkoutUrl: checkout.checkoutUrl });
  } catch (error) { console.error('[WhatsApp Module]', error); return NextResponse.json({ error: 'Não foi possível preparar o pagamento agora. Tente novamente em instantes.' }, { status: 503 }); }
}
