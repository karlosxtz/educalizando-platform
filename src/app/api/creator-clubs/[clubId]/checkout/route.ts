import { getRequestUser } from '@/lib/api-auth';
import { creatorClubFinancials } from '@/lib/creator-club';
import { createInfinitePayCheckout } from '@/lib/infinitepay-service';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';

export async function POST(request: Request, { params }: { params: Promise<{ clubId: string }> }) {
  let subscriptionId: string | null = null;
  let paymentId: string | null = null;
  try {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: 'Faça login como cliente para assinar.', loginRequired: true }, { status: 401 });
    const { clubId } = await params;
    const { data: club, error } = await supabaseAdmin.from('creator_clubs').select('id,name,slug,monthly_price,store_id,creator_id,status').eq('id', clubId).maybeSingle();
    if (error) throw error;
    if (!club || club.status !== 'published') return NextResponse.json({ error: 'Este clube não está disponível.' }, { status: 404 });
    if (club.creator_id === user.id) return NextResponse.json({ error: 'O criador não pode assinar o próprio clube.' }, { status: 400 });
    const now = new Date().toISOString();
    const { data: active } = await supabaseAdmin.from('creator_club_subscriptions').select('id,expires_at').eq('club_id', club.id).eq('student_id', user.id).eq('status', 'active').gt('expires_at', now).limit(1).maybeSingle();
    if (active) return NextResponse.json({ success: true, alreadyActive: true, redirectUrl: `/cliente/clubes/${club.id}` });
    const { data: pending } = await supabaseAdmin.from('creator_club_payments').select('id,subscription_id,checkout_url,created_at').eq('club_id', club.id).eq('student_id', user.id).eq('status', 'pending').gt('created_at', new Date(Date.now() - 30 * 60_000).toISOString()).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (pending?.checkout_url) return NextResponse.json({ success: true, checkoutUrl: pending.checkout_url });

    const price = Number(club.monthly_price);
    const financials = creatorClubFinancials(price);
    const { data: subscription, error: subscriptionError } = await supabaseAdmin.from('creator_club_subscriptions').insert({ club_id: club.id, store_id: club.store_id, student_id: user.id, status: 'pending' }).select('id').single();
    if (subscriptionError) throw subscriptionError;
    subscriptionId = subscription.id;
    const orderNsu = `club_${randomUUID().replaceAll('-', '')}`;
    const { data: payment, error: paymentError } = await supabaseAdmin.from('creator_club_payments').insert({
      subscription_id: subscription.id, club_id: club.id, store_id: club.store_id, creator_id: club.creator_id, student_id: user.id,
      order_nsu: orderNsu, gross_amount: financials.grossAmount, platform_fee_amount: financials.platformFeeAmount,
      creator_net_amount: financials.creatorNetAmount, status: 'pending',
    }).select('id').single();
    if (paymentError) throw paymentError;
    paymentId = payment.id;
    const origin = new URL(request.url).origin;
    const checkout = await createInfinitePayCheckout({
      orderNsu, redirectUrl: `${origin}/cliente/clubes?pagamento=processando`, webhookUrl: `${origin}/api/webhooks/infinitepay`,
      items: [{ quantity: 1, price: Math.round(price * 100), description: `30 dias — ${club.name}` }],
      customer: { name: user.user_metadata?.full_name || user.email || 'Cliente Educalizando', email: user.email || '' },
    });
    await supabaseAdmin.from('creator_club_payments').update({ checkout_url: checkout.checkoutUrl, updated_at: new Date().toISOString() }).eq('id', payment.id);
    return NextResponse.json({ success: true, checkoutUrl: checkout.checkoutUrl });
  } catch (error) {
    console.error('[Creator Club Checkout] Falha:', error);
    if (paymentId) await supabaseAdmin.from('creator_club_payments').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', paymentId);
    if (subscriptionId) await supabaseAdmin.from('creator_club_subscriptions').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', subscriptionId);
    return NextResponse.json({ error: 'Não foi possível abrir o pagamento agora.' }, { status: 500 });
  }
}

