import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';

async function access(id: string, userId: string) {
  const { data } = await supabaseAdmin.from('exclusive_material_requests').select('*').eq('id', id).maybeSingle();
  if (!data || (data.customer_id !== userId && data.creator_id !== userId)) return null;
  return data;
}
export async function GET(_request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  const user = await getRequestUser(_request); const { requestId } = await params;
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  if (!await access(requestId, user.id)) return NextResponse.json({ error: 'Sem acesso.' }, { status: 403 });
  const { data, error } = await supabaseAdmin.from('exclusive_material_messages').select('*').eq('request_id', requestId).order('created_at');
  if (error) throw error; return NextResponse.json({ messages: data || [] });
}
export async function POST(request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  const user = await getRequestUser(request); const { requestId } = await params;
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const item = await access(requestId, user.id); if (!item) return NextResponse.json({ error: 'Sem acesso.' }, { status: 403 });
  if (['delivered', 'cancelled', 'rejected'].includes(item.status)) return NextResponse.json({ error: 'Esta solicitação foi finalizada e a conversa está encerrada.' }, { status: 409 });
  const { body, attachments = [] } = await request.json();
  if (!String(body || '').trim()) return NextResponse.json({ error: 'Escreva uma mensagem.' }, { status: 400 });
  const senderRole = item.creator_id === user.id ? 'creator' : 'customer';
  const { data, error } = await supabaseAdmin.from('exclusive_material_messages').insert({ request_id: requestId, sender_id: user.id, sender_role: senderRole, body: String(body).trim(), attachments: Array.isArray(attachments) ? attachments : [] }).select('*').single();
  if (error) throw error;
  await supabaseAdmin.from('exclusive_material_requests').update({ status: item.status === 'open' ? 'negotiating' : item.status, updated_at: new Date().toISOString() }).eq('id', requestId);
  if (senderRole === 'creator') await supabaseAdmin.from('exclusive_material_notifications').insert({ customer_id: item.customer_id, request_id: requestId, type: 'message', title: 'Nova mensagem sobre seu material exclusivo', body: String(body).trim().slice(0, 160) });
  return NextResponse.json({ message: data }, { status: 201 });
}
