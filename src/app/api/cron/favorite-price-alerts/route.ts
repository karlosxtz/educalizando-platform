import { supabaseAdmin } from '@/lib/supabase';
import { sendEvolutionText } from '@/lib/whatsapp-notification-service';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  const { data: favorites, error } = await supabaseAdmin
    .from('favorite_price_alert_candidates')
    .select('user_id, product_id, price_when_favorited, current_price')
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let sent = 0;
  let skipped = 0;
  for (const favorite of favorites || []) {
    const { data: product } = await supabaseAdmin.from('products').select('titulo, slug, preco, status, stores!inner(slug)').eq('id', favorite.product_id).maybeSingle();
    const currentPrice = Number(product?.preco || 0);
    const oldPrice = Number(favorite.price_when_favorited || 0);
    if (!product || product.status !== 'publicado' || currentPrice >= oldPrice) { skipped++; continue; }

    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(favorite.user_id);
    const email = userData?.user?.email;
    const phoneFromProfile = String(userData?.user?.user_metadata?.whatsapp || userData?.user?.user_metadata?.phone || '').replace(/\D/g, '');
    const { data: order } = email ? await supabaseAdmin.from('orders').select('buyer_phone').eq('buyer_email', email).not('buyer_phone', 'is', null).order('created_at', { ascending: false }).limit(1).maybeSingle() : { data: null };
    const phone = phoneFromProfile || String(order?.buyer_phone || '').replace(/\D/g, '');
    const store = Array.isArray(product.stores) ? product.stores[0] : product.stores;
    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.educalizando.com.br').replace(/\/$/, '');
    const url = `${baseUrl}/loja/${store?.slug}/produto/${product.slug}`;

    const { data: alert, error: claimError } = await supabaseAdmin.rpc('claim_favorite_price_alert', { p_user: favorite.user_id, p_product: favorite.product_id, p_old: oldPrice, p_new: currentPrice });
    if (claimError || !alert) { skipped++; continue; }
    if (!phone) { await supabaseAdmin.from('favorite_price_alerts').update({ status: 'skipped' }).eq('id', alert); skipped++; continue; }
    const result = await sendEvolutionText(phone, `💚 Um material que você favoritou entrou em promoção!\n\n${product.titulo}\nDe R$ ${oldPrice.toFixed(2).replace('.', ',')} por R$ ${currentPrice.toFixed(2).replace('.', ',')}\n\nAproveite: ${url}`);
    await supabaseAdmin.from('favorite_price_alerts').update(result.sent ? { status: 'sent', sent_at: new Date().toISOString(), error_message: null } : { status: 'failed', error_message: result.error || 'Falha no envio' }).eq('id', alert);
    if (result.sent) {
      await supabaseAdmin.from('product_favorites').update({ last_notified_price: currentPrice }).eq('user_id', favorite.user_id).eq('product_id', favorite.product_id);
      sent++;
    }
  }
  return NextResponse.json({ success: true, inspected: favorites?.length || 0, sent, skipped });
}
