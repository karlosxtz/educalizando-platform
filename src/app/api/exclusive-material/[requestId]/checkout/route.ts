import { getRequestUser } from '@/lib/api-auth';
import { exclusiveFinancials } from '@/lib/exclusive-material';
import { createInfinitePayCheckout } from '@/lib/infinitepay-service';
import { supabaseAdmin } from '@/lib/supabase';
import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';

export async function POST(request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  const user = await getRequestUser(request); const { requestId } = await params;
  if (!user?.email) return NextResponse.json({ error: 'Entre na sua conta de cliente para continuar.' }, { status: 401 });
  const { data: item } = await supabaseAdmin.from('exclusive_material_requests').select('*, store:stores(nome_loja,whatsapp)').eq('id', requestId).eq('customer_id', user.id).maybeSingle();
  if (!item?.accepted_proposal_id) return NextResponse.json({ error: 'Aceite uma proposta antes de abrir o pagamento.' }, { status: 400 });
  const { data: proposal } = await supabaseAdmin.from('exclusive_material_proposals').select('*').eq('id', item.accepted_proposal_id).eq('status', 'accepted').maybeSingle();
  if (!proposal) return NextResponse.json({ error: 'A proposta aceita não está disponível.' }, { status: 409 });
  const { data: existing } = await supabaseAdmin.from('exclusive_material_payments').select('*').eq('request_id', requestId).maybeSingle();
  if (existing?.status === 'paid') return NextResponse.json({ error: 'Este pedido já foi pago.' }, { status: 409 });
  if (existing?.status === 'pending' && typeof existing.checkout_url === 'string' && existing.checkout_url.startsWith('https://')) {
    return NextResponse.json({ checkoutUrl: existing.checkout_url, amount: Number(proposal.amount) });
  }
  try {
    const financials = exclusiveFinancials(Number(proposal.amount)); const orderNsu = existing?.order_nsu || `exclusive_${randomUUID()}`;
    const origin = new URL(request.url).origin;
    const phoneDigits = String(user.user_metadata?.whatsapp || user.user_metadata?.phone || user.phone || '').replace(/\D/g, '');
    const phoneNumber = phoneDigits ? `+${phoneDigits.startsWith('55') ? phoneDigits : `55${phoneDigits}`}` : undefined;
    const checkout = await createInfinitePayCheckout({ orderNsu, redirectUrl: `${origin}/cliente/materiais-exclusivos?pedido=${encodeURIComponent(requestId)}&payment=processing`, webhookUrl: `${origin}/api/webhooks/infinitepay`, customer: phoneNumber ? { name: user.user_metadata?.full_name || user.email, email: user.email, phoneNumber } : undefined, items: [{ quantity: 1, price: Math.round(Number(proposal.amount) * 100), description: `Material exclusivo: ${item.title}` }] });
    if (!checkout.checkoutUrl) return NextResponse.json({ error: 'Não foi possível gerar a página de pagamento.' }, { status: 502 });
    const payload = { request_id: requestId, proposal_id: proposal.id, order_nsu: orderNsu, checkout_url: checkout.checkoutUrl, gross_amount: financials.grossAmount, platform_fee_amount: financials.platformFeeAmount, creator_net_amount: financials.creatorNetAmount, status: 'pending' };
    const { error } = existing ? await supabaseAdmin.from('exclusive_material_payments').update(payload).eq('id', existing.id) : await supabaseAdmin.from('exclusive_material_payments').insert(payload);
    if (error) return NextResponse.json({ error: 'Não foi possível registrar o pagamento para este pedido.' }, { status: 500 });
    return NextResponse.json({ checkoutUrl: checkout.checkoutUrl, amount: Number(proposal.amount) });
  } catch (caught) {
    console.error('Falha ao abrir o checkout de material exclusivo:', caught);
    return NextResponse.json({ error: 'Não foi possível iniciar o pagamento agora. Revise a configuração financeira e tente novamente.' }, { status: 500 });
  }
}
