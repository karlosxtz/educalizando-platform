import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  const user = await getRequestUser(request); const { requestId } = await params;
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const { data: item } = await supabaseAdmin.from('exclusive_material_requests').select('*').eq('id', requestId).maybeSingle();
  if (!item || item.creator_id !== user.id) return NextResponse.json({ error: 'Somente o criador pode entregar este material.' }, { status: 403 });
  if (!['paid','in_production','delivered'].includes(item.status)) return NextResponse.json({ error: 'A entrega só pode ser enviada depois do pagamento.' }, { status: 409 });
  const body = await request.json(); const files = Array.isArray(body.files) ? body.files : [];
  if (!files.length) return NextResponse.json({ error: 'Anexe pelo menos um arquivo.' }, { status: 400 });
  const rows = files.slice(0, 20).map((file: any) => ({ request_id: requestId, creator_id: user.id, file_name: String(file.name || 'material'), file_url: String(file.url || ''), content_type: String(file.contentType || ''), file_size: Number(file.size || 0), note: String(body.note || '') || null })).filter((file: any) => file.file_url);
  if (!rows.length) return NextResponse.json({ error: 'Arquivos inválidos.' }, { status: 400 });
  const { error } = await supabaseAdmin.from('exclusive_material_deliveries').insert(rows); if (error) throw error;
  await supabaseAdmin.from('exclusive_material_requests').update({ status: 'delivered', delivered_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', requestId);
  await supabaseAdmin.from('exclusive_material_notifications').insert({ customer_id: item.customer_id, request_id: requestId, type: 'delivered', title: 'Material exclusivo entregue', body: `Seu material “${item.title}” já está disponível para acessar.` });
  return NextResponse.json({ ok: true });
}
