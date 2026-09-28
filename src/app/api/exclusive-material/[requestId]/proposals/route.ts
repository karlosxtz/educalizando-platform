import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';

async function findRequest(id: string) { const { data } = await supabaseAdmin.from('exclusive_material_requests').select('*').eq('id', id).maybeSingle(); return data; }
export async function POST(request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  const user = await getRequestUser(request); const { requestId } = await params;
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const item = await findRequest(requestId); if (!item || item.creator_id !== user.id) return NextResponse.json({ error: 'Somente o criador desta loja pode enviar uma proposta.' }, { status: 403 });
  const body = await request.json(); const amount = Number(body.amount); const deliveryDays = Number(body.deliveryDays);
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(deliveryDays) || deliveryDays < 1 || !String(body.scope || '').trim()) return NextResponse.json({ error: 'Informe valor, prazo e o que será entregue.' }, { status: 400 });
  await supabaseAdmin.from('exclusive_material_proposals').update({ status: 'superseded' }).eq('request_id', requestId).eq('status', 'sent');
  const { data, error } = await supabaseAdmin.from('exclusive_material_proposals').insert({ request_id: requestId, creator_id: user.id, amount, delivery_days: deliveryDays, scope: String(body.scope).trim(), revisions: Math.max(0, Number(body.revisions || 0)) }).select('*').single();
  if (error) throw error;
  await supabaseAdmin.from('exclusive_material_requests').update({ status: 'awaiting_payment', updated_at: new Date().toISOString() }).eq('id', requestId);
  await supabaseAdmin.from('exclusive_material_messages').insert({ request_id: requestId, sender_id: user.id, sender_role: 'creator', body: `Enviei uma proposta de R$ ${amount.toFixed(2).replace('.', ',')} para esta solicitação.` });
  await supabaseAdmin.from('exclusive_material_notifications').insert({ customer_id: item.customer_id, request_id: requestId, type: 'proposal', title: 'Você recebeu uma proposta', body: `O criador enviou uma proposta para “${item.title}”.` });
  return NextResponse.json({ proposal: data }, { status: 201 });
}
export async function PATCH(request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  const user = await getRequestUser(request); const { requestId } = await params;
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const item = await findRequest(requestId); if (!item || item.customer_id !== user.id) return NextResponse.json({ error: 'Somente o cliente pode responder à proposta.' }, { status: 403 });
  const { proposalId, action } = await request.json();
  const { data: proposal } = await supabaseAdmin.from('exclusive_material_proposals').select('*').eq('id', proposalId).eq('request_id', requestId).eq('status', 'sent').maybeSingle();
  if (!proposal) return NextResponse.json({ error: 'Esta proposta não está mais disponível.' }, { status: 409 });
  const accepted = action === 'accept';
  await supabaseAdmin.from('exclusive_material_proposals').update({ status: accepted ? 'accepted' : 'declined', responded_at: new Date().toISOString() }).eq('id', proposal.id);
  await supabaseAdmin.from('exclusive_material_requests').update({ accepted_proposal_id: accepted ? proposal.id : null, status: accepted ? 'awaiting_payment' : 'negotiating', updated_at: new Date().toISOString() }).eq('id', requestId);
  return NextResponse.json({ accepted });
}
