import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { assertCheckoutFinancialConfiguration } from '@/lib/financial-configuration';
import { createInfinitePayCheckout } from '@/lib/infinitepay-service';
import { exclusiveFinancials } from '@/lib/exclusive-material';

export async function POST(request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  const user = await getRequestUser(request); const { requestId } = await params;
  if (!user?.email) return NextResponse.json({ error: 'Entre na sua conta de cliente para continuar.' }, { status: 401 });
  const { data: item } = await supabaseAdmin.from('exclusive_material_requests').select('*, store:stores(nome_loja,whatsapp)').eq('id', requestId).eq('customer_id', user.id).maybeSingle();
  if (!item?.accepted_proposal_id) return NextResponse.json({ error: 'Aceite uma proposta antes de abrir o pagamento.' }, { status: 400 });
  const { data: proposal } = await supabaseAdmin.from('exclusive_material_proposals').select('*').eq('id', item.accepted_proposal_id).eq('status', 'accepted').maybeSingle();
  if (!proposal) return NextResponse.json({ error: 'A proposta aceita não está disponível.' }, { status: 409 });
  const { data: existing } = await supabaseAdmin.from('exclusive_material_payments').select('*').eq('request_id', requestId).maybeSingle();
  if (existing?.status === 'paid') return NextResponse.json({ error: 'Este pedido já foi pago.' }, { status: 409 });
  assertCheckoutFinancialConfiguration();
  const financials = exclusiveFinancials(Number(proposal.amount)); const orderNsu = existing?.order_nsu || `exclusive_${randomUUID()}`;
  const origin = new URL(request.url).origin;
  const checkout = await createInfinitePayCheckout({ orderNsu, redirectUrl: `${origin}/cliente/materiais-exclusivos?payment=processing`, webhookUrl: `${origin}/api/webhooks/infinitepay`, customer: { name: user.user_metadata?.full_name || user.email, email: user.email, phoneNumber: item.store?.whatsapp || undefined }, items: [{ quantity: 1, price: Math.round(financials.grossAmount * 100), description: `Material exclusivo: ${item.title}` }] });
  const payload = { request_id: requestId, proposal_id: proposal.id, order_nsu: orderNsu, checkout_url: checkout.checkoutUrl, gross_amount: financials.grossAmount, platform_fee_amount: financials.platformFeeAmount, creator_net_amount: financials.creatorNetAmount, status: 'pending' };
  const { error } = existing ? await supabaseAdmin.from('exclusive_material_payments').update(payload).eq('id', existing.id) : await supabaseAdmin.from('exclusive_material_payments').insert(payload);
  if (error) throw error;
  return NextResponse.json({ checkoutUrl: checkout.checkoutUrl });
}
