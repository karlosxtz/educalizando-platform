import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';

async function findRequest(id: string) { const { data } = await supabaseAdmin.from('exclusive_material_requests').select('*').eq('id', id).maybeSingle(); return data; }
function expectedDeliveryDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'America/Sao_Paulo' }).format(date);
}
export async function POST(request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  const user = await getRequestUser(request); const { requestId } = await params;
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const item = await findRequest(requestId); if (!item || item.creator_id !== user.id) return NextResponse.json({ error: 'Somente o criador desta loja pode enviar uma proposta.' }, { status: 403 });
  if (item.accepted_proposal_id || ['awaiting_payment', 'paid', 'in_production', 'delivered', 'cancelled', 'rejected'].includes(item.status)) return NextResponse.json({ error: 'A proposta desta solicitação já foi aceita ou o pedido foi finalizado.' }, { status: 409 });
  const body = await request.json(); const amount = Number(body.amount); const deliveryDays = Number(body.deliveryDays);
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(deliveryDays) || deliveryDays < 1 || !String(body.scope || '').trim()) return NextResponse.json({ error: 'Informe valor, prazo e o que será entregue.' }, { status: 400 });
  await supabaseAdmin.from('exclusive_material_proposals').update({ status: 'superseded' }).eq('request_id', requestId).eq('status', 'sent');
  const revisions = Math.max(0, Number(body.revisions || 0));
  const scope = String(body.scope).trim();
  const { data, error } = await supabaseAdmin.from('exclusive_material_proposals').insert({ request_id: requestId, creator_id: user.id, amount, delivery_days: deliveryDays, scope, revisions }).select('*').single();
  if (error) throw error;
  await supabaseAdmin.from('exclusive_material_requests').update({ status: 'negotiating', updated_at: new Date().toISOString() }).eq('id', requestId);
  await supabaseAdmin.from('exclusive_material_messages').insert({ request_id: requestId, sender_id: user.id, sender_role: 'creator', body: `Proposta enviada: R$ ${amount.toFixed(2).replace('.', ',')}.\nPrazo de produção: ${deliveryDays} ${deliveryDays === 1 ? 'dia' : 'dias'}.\nData prevista para entrega: ${expectedDeliveryDate(deliveryDays)}.\nRevisões incluídas: ${revisions}.\n\nO que será entregue:\n${scope}` });
  await supabaseAdmin.from('exclusive_material_notifications').insert({ customer_id: item.customer_id, request_id: requestId, type: 'proposal', title: 'Você recebeu uma proposta', body: `O criador enviou uma proposta para “${item.title}”.` });
  return NextResponse.json({ proposal: data }, { status: 201 });
}
export async function PATCH(request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  const user = await getRequestUser(request); const { requestId } = await params;
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const item = await findRequest(requestId); if (!item || item.customer_id !== user.id) return NextResponse.json({ error: 'Somente o cliente pode responder à proposta.' }, { status: 403 });
  if (item.accepted_proposal_id || ['paid', 'in_production', 'delivered', 'cancelled', 'rejected'].includes(item.status)) return NextResponse.json({ error: 'Esta solicitação já possui uma proposta aceita ou foi finalizada.' }, { status: 409 });
  const { proposalId, action, amount, deliveryDays, scope } = await request.json();
  const { data: proposal } = await supabaseAdmin.from('exclusive_material_proposals').select('*').eq('id', proposalId).eq('request_id', requestId).eq('status', 'sent').maybeSingle();
  if (!proposal) return NextResponse.json({ error: 'Esta proposta não está mais disponível.' }, { status: 409 });
  if (action === 'counter') {
    const counterAmount = Number(amount);
    const counterDays = Number(deliveryDays);
    const counterScope = String(scope || '').trim();
    if (!Number.isFinite(counterAmount) || counterAmount <= 0 || !Number.isInteger(counterDays) || counterDays < 1 || !counterScope) {
      return NextResponse.json({ error: 'Informe valor, prazo e os detalhes da sua contraproposta.' }, { status: 400 });
    }
    await supabaseAdmin.from('exclusive_material_proposals').update({ status: 'superseded', responded_at: new Date().toISOString() }).eq('id', proposal.id);
    await supabaseAdmin.from('exclusive_material_requests').update({ accepted_proposal_id: null, status: 'negotiating', updated_at: new Date().toISOString() }).eq('id', requestId);
    await supabaseAdmin.from('exclusive_material_messages').insert({ request_id: requestId, sender_id: user.id, sender_role: 'customer', body: `Contraproposta do cliente:\nValor sugerido: R$ ${counterAmount.toFixed(2).replace('.', ',')}.\nPrazo desejado: ${counterDays} ${counterDays === 1 ? 'dia' : 'dias'}.\n\nDetalhes:\n${counterScope}` });
    await supabaseAdmin.from('exclusive_material_notifications').insert({ customer_id: user.id, request_id: requestId, type: 'message', title: 'Sua contraproposta foi enviada', body: `A contraproposta para “${item.title}” foi registrada e enviada ao criador.` });
    return NextResponse.json({ countered: true });
  }
  const accepted = action === 'accept';
  await supabaseAdmin.from('exclusive_material_proposals').update({ status: accepted ? 'accepted' : 'declined', responded_at: new Date().toISOString() }).eq('id', proposal.id);
  await supabaseAdmin.from('exclusive_material_requests').update({ accepted_proposal_id: accepted ? proposal.id : null, status: accepted ? 'awaiting_payment' : 'negotiating', updated_at: new Date().toISOString() }).eq('id', requestId);
  if (accepted) await supabaseAdmin.from('exclusive_material_messages').insert({ request_id: requestId, sender_id: user.id, sender_role: 'system', body: `Proposta aceita pelo cliente. Prazo contratado: ${proposal.delivery_days} ${proposal.delivery_days === 1 ? 'dia' : 'dias'}. A contagem para entrega foi iniciada.` });
  return NextResponse.json({ accepted });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  const user = await getRequestUser(request); const { requestId } = await params;
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const item = await findRequest(requestId);
  if (!item || (item.customer_id !== user.id && item.creator_id !== user.id)) return NextResponse.json({ error: 'Sem acesso.' }, { status: 403 });
  if (['paid', 'in_production', 'delivered'].includes(item.status)) return NextResponse.json({ error: 'Após o pagamento, o cancelamento exige um processo de estorno.' }, { status: 409 });
  const { proposalId } = await request.json();
  const { data: proposal } = await supabaseAdmin.from('exclusive_material_proposals').select('id,status').eq('id', proposalId).eq('request_id', requestId).in('status', ['sent', 'accepted']).maybeSingle();
  if (!proposal) return NextResponse.json({ error: 'Esta proposta não está mais disponível.' }, { status: 404 });
  await supabaseAdmin.from('exclusive_material_proposals').update({ status: 'superseded', responded_at: new Date().toISOString() }).eq('id', proposal.id);
  await supabaseAdmin.from('exclusive_material_requests').update({ accepted_proposal_id: null, status: 'negotiating', updated_at: new Date().toISOString() }).eq('id', requestId);
  const cancelledByCreator = item.creator_id === user.id;
  const body = cancelledByCreator
    ? 'O criador cancelou a proposta e informou que não dará início ao projeto neste momento.'
    : 'O cliente cancelou a proposta. A negociação poderá continuar com uma nova proposta.';
  await supabaseAdmin.from('exclusive_material_messages').insert({ request_id: requestId, sender_id: user.id, sender_role: 'system', body });
  if (cancelledByCreator) await supabaseAdmin.from('exclusive_material_notifications').insert({ customer_id: item.customer_id, request_id: requestId, type: 'proposal', title: 'Proposta cancelada pelo criador', body: 'O criador informou que não dará início ao projeto. Você pode conversar ou aguardar uma nova proposta.' });
  return NextResponse.json({ cancelled: true });
}
