import { NextResponse } from 'next/server';
import { normalizeWhatsAppNumber } from '@/lib/whatsapp-notification-service';
import { supabaseAdmin } from '@/lib/supabase';

type RequestedItem = { productId?: string; quantity?: number };

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const phone = normalizeWhatsAppNumber(body.phone);
    const items = Array.isArray(body.items) ? body.items.slice(0, 20) as RequestedItem[] : [];
    if (!body.consent || !phone || !body.storeId || !body.browserToken || !items.length) {
      return NextResponse.json({ error: 'Dados insuficientes para salvar o lembrete.' }, { status: 400 });
    }
    const ids = items.map((item) => item.productId).filter((id): id is string => typeof id === 'string');
    const { data: products } = await supabaseAdmin.from('products').select('id, titulo, preco, store_id, status').in('id', ids).eq('status', 'publicado');
    if (!products?.length || products.length !== ids.length || products.some((product) => product.store_id !== body.storeId)) {
      return NextResponse.json({ error: 'Os materiais do carrinho não são válidos.' }, { status: 400 });
    }
    const { data: store } = await supabaseAdmin.from('stores').select('slug').eq('id', body.storeId).maybeSingle();
    if (!store?.slug) return NextResponse.json({ error: 'Loja não encontrada.' }, { status: 404 });
    const cartItems = products.map((product) => {
      const requested = items.find((item) => item.productId === product.id);
      const quantity = Math.max(1, Math.min(10, Number(requested?.quantity) || 1));
      return { productId: product.id, title: product.titulo, price: Number(product.preco), quantity };
    });
    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const { data, error } = await supabaseAdmin.from('abandoned_cart_reminders').upsert({
      browser_token: body.browserToken,
      store_id: body.storeId,
      store_slug: store.slug,
      customer_name: typeof body.customerName === 'string' ? body.customerName.trim().slice(0, 120) : null,
      phone_e164: phone,
      consented_at: new Date().toISOString(),
      cart_items: cartItems,
      total_amount: total,
      status: 'pending',
      send_after: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
      sent_at: null,
      order_id: null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'browser_token,store_id' }).select('recovery_token').single();
    if (error || !data) throw error || new Error('Não foi possível salvar o lembrete.');
    return NextResponse.json({ success: true, recoveryToken: data.recovery_token });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Não foi possível salvar o lembrete.' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'Link inválido.' }, { status: 400 });
  const { data } = await supabaseAdmin.from('abandoned_cart_reminders').select('store_id, store_slug, cart_items').eq('recovery_token', token).in('status', ['pending', 'sent']).maybeSingle();
  if (!data) return NextResponse.json({ error: 'Este carrinho não está mais disponível.' }, { status: 404 });
  return NextResponse.json({ success: true, cart: data });
}
