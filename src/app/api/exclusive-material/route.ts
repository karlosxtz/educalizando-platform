import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

async function creatorStore(userId: string) {
  // Um criador pode operar mais de uma loja; basta comprovar que ele possui ao menos uma.
  const { data } = await supabaseAdmin.from('stores').select('id, creator_id, nome_loja, slug').eq('creator_id', userId).limit(1).maybeSingle();
  return data;
}

export async function GET(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: 'Entre para acessar suas solicitações.' }, { status: 401 });
  const view = new URL(request.url).searchParams.get('view') || 'customer';
  const isCreator = view === 'creator';
  const store = isCreator ? await creatorStore(user.id) : null;
  if (isCreator && !store) return NextResponse.json({ error: 'Apenas criadores podem acessar esta área.' }, { status: 403 });
  let query = supabaseAdmin
    .from('exclusive_material_requests')
    .select('*, store:stores(id,nome_loja,slug,logo_url), proposals:exclusive_material_proposals!exclusive_material_proposals_request_id_fkey(*), payments:exclusive_material_payments(*), deliveries:exclusive_material_deliveries(*)')
    .order('updated_at', { ascending: false });
  // A identidade autenticada determina o acesso; e-mail não substitui ownership.
  query = isCreator
    ? query.eq('creator_id', user.id).is('hidden_by_creator_at', null)
    : query.eq('customer_id', user.id).is('hidden_by_customer_at', null);
  let { data, error } = await query;
  // Compatibilidade durante o intervalo entre o deploy da aplicação e a
  // aplicação da migração de arquivamento no banco de produção.
  if (error?.code === '42703') {
    const fallback = await supabaseAdmin
      .from('exclusive_material_requests')
      .select('*, store:stores(id,nome_loja,slug,logo_url), proposals:exclusive_material_proposals!exclusive_material_proposals_request_id_fkey(*), payments:exclusive_material_payments(*), deliveries:exclusive_material_deliveries(*)')
      .eq(isCreator ? 'creator_id' : 'customer_id', user.id)
      .order('updated_at', { ascending: false });
    data = fallback.data;
    error = fallback.error;
  }
  if (error) return NextResponse.json({ error: `Não foi possível listar solicitações: ${error.message}` }, { status: 500 });
  const { data: notifications } = !isCreator ? await supabaseAdmin.from('exclusive_material_notifications').select('*').eq('customer_id', user.id).is('read_at', null).order('created_at', { ascending: false }) : { data: [] };
  return NextResponse.json({ requests: data || [], notifications: notifications || [] });
}

export async function POST(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: 'Entre na sua área de cliente para solicitar um material.' }, { status: 401 });
  // Um criador não pode encomendar pela área do criador: use uma conta de cliente.
  if (await creatorStore(user.id)) return NextResponse.json({ error: 'Esta solicitação deve ser feita pela área de cliente, e não pela conta de criador.' }, { status: 403 });
  const body = await request.json();
  const storeId = String(body.storeId || '');
  const title = String(body.title || '').trim();
  const description = String(body.description || '').trim();
  const quantity = Number(body.quantity || 1);
  if (!storeId || !title || !description || !Number.isInteger(quantity) || quantity < 1) return NextResponse.json({ error: 'Preencha título, quantidade e a descrição do material.' }, { status: 400 });
  const { data: store } = await supabaseAdmin.from('stores').select('id, creator_id, nome_loja, slug, exclusive_material_requests_enabled').eq('id', storeId).maybeSingle();
  if (!store) return NextResponse.json({ error: 'Loja não encontrada.' }, { status: 404 });
  if (!store.exclusive_material_requests_enabled) return NextResponse.json({ error: 'Este criador não está aceitando solicitações de materiais exclusivos no momento.' }, { status: 403 });
  // Cada cliente mantém uma única negociação ativa por loja. Isso evita pedidos
  // paralelos, conversas duplicadas e propostas concorrentes para o mesmo criador.
  const { data: existingRequests, error: existingRequestsError } = await supabaseAdmin
    .from('exclusive_material_requests')
    .select('id, title, status')
    .eq('store_id', store.id)
    .eq('customer_id', user.id)
    .order('updated_at', { ascending: false });
  if (existingRequestsError) return NextResponse.json({ error: 'Não foi possível verificar seus pedidos em andamento.' }, { status: 500 });
  const activeRequest = (existingRequests || []).find((item) => !['delivered', 'cancelled', 'rejected'].includes(item.status));
  if (activeRequest) {
    return NextResponse.json({
      error: `Você já possui o pedido “${activeRequest.title}” em andamento nesta loja. Finalize ou cancele esse pedido antes de criar outro.`,
      requestId: activeRequest.id,
    }, { status: 409 });
  }
  const customerName = String(user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Cliente Educalizando').trim();
  const customerAvatarUrl = typeof user.user_metadata?.avatar_url === 'string' ? user.user_metadata.avatar_url : typeof user.user_metadata?.picture === 'string' ? user.user_metadata.picture : null;
  const { data, error } = await supabaseAdmin.from('exclusive_material_requests').insert({
    store_id: store.id, creator_id: store.creator_id, customer_id: user.id, title, quantity,
    customer_name: customerName, customer_email: user.email, customer_avatar_url: customerAvatarUrl,
    genre: String(body.genre || '').trim() || null, file_type: String(body.fileType || '').trim() || null,
    target_audience: String(body.targetAudience || '').trim() || null, deadline: body.deadline || null,
    budget: body.budget ? Number(body.budget) : null, description,
    reference_links: Array.isArray(body.referenceLinks) ? body.referenceLinks.filter((value: unknown) => typeof value === 'string').slice(0, 8) : []
  }).select('*').single();
  if (error || !data?.id) return NextResponse.json({ error: error?.message || 'A solicitação não foi gravada no banco.' }, { status: 500 });
  await supabaseAdmin.from('exclusive_material_messages').insert({ request_id: data.id, sender_id: user.id, sender_role: 'customer', body: 'Solicitação criada. Aguardo a proposta do criador.' });
  const { data: verifiedRequest, error: verificationError } = await supabaseAdmin.from('exclusive_material_requests').select('id, customer_id, creator_id').eq('id', data.id).maybeSingle();
  if (verificationError || !verifiedRequest || verifiedRequest.customer_id !== user.id || verifiedRequest.creator_id !== store.creator_id) {
    return NextResponse.json({ error: 'A solicitação não pôde ser confirmada. Nenhum redirecionamento foi feito.' }, { status: 500 });
  }
  // O painel do criador filtra por creator_id, o mesmo valor copiado da loja
  // validada acima. Assim a solicitação não pode cair em outro painel.
  return NextResponse.json({ request: data, creatorDashboardPath: '/dashboard/materiais-exclusivos' }, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const requestId = new URL(request.url).searchParams.get('requestId');
  if (!requestId) return NextResponse.json({ error: 'Solicitação inválida.' }, { status: 400 });
  const { data: item } = await supabaseAdmin.from('exclusive_material_requests').select('*').eq('id', requestId).maybeSingle();
  if (!item || (item.customer_id !== user.id && item.creator_id !== user.id)) return NextResponse.json({ error: 'Sem acesso.' }, { status: 403 });
  const isCreator = item.creator_id === user.id;
  const now = new Date().toISOString();
  const isFinished = ['delivered', 'cancelled', 'rejected'].includes(item.status);
  if (!isFinished) {
    const { data: paidPayment, error: paymentError } = await supabaseAdmin
      .from('exclusive_material_payments')
      .select('id')
      .eq('request_id', requestId)
      .eq('status', 'paid')
      .limit(1);
    if (paymentError) return NextResponse.json({ error: 'Não foi possível confirmar o pagamento desta solicitação.' }, { status: 500 });
    if (paidPayment?.length || ['paid', 'in_production'].includes(item.status)) {
      return NextResponse.json({ error: 'Esta solicitação já foi paga e não pode mais ser cancelada. Qualquer encerramento financeiro exige um processo de estorno.' }, { status: 409 });
    }
  }

  const updates: Record<string, string> = { [isCreator ? 'hidden_by_creator_at' : 'hidden_by_customer_at']: now, updated_at: now };
  if (!isFinished) {
    updates.status = 'cancelled';
    updates.cancelled_at = now;
    updates.cancelled_by = user.id;
    const body = isCreator
      ? 'O criador cancelou a execução do serviço e removeu esta solicitação do painel dele.'
      : 'O cliente cancelou a solicitação do serviço e removeu o pedido do painel dele.';
    await supabaseAdmin.from('exclusive_material_messages').insert({ request_id: requestId, sender_id: user.id, sender_role: 'system', body });
    await supabaseAdmin.from('exclusive_material_notifications').insert({ customer_id: item.customer_id, request_id: requestId, type: 'message', title: isCreator ? 'Execução do serviço cancelada' : 'Solicitação cancelada', body });
  }
  const { error } = await supabaseAdmin.from('exclusive_material_requests').update(updates).eq('id', requestId);
  if (error) return NextResponse.json({ error: 'Não foi possível remover a solicitação.' }, { status: 500 });
  return NextResponse.json({ removed: true, cancelled: !isFinished });
}
