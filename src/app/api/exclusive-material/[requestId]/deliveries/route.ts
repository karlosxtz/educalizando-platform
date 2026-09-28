import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';

type DeliveryInput = {
  url: string;
  name?: string;
  contentType?: string;
  size?: number;
};

function isDeliveryInput(value: unknown): value is DeliveryInput {
  return typeof value === 'object' && value !== null && typeof (value as { url?: unknown }).url === 'string' && Boolean((value as { url: string }).url.trim());
}

export async function POST(request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  const user = await getRequestUser(request); const { requestId } = await params;
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const { data: item } = await supabaseAdmin.from('exclusive_material_requests').select('*').eq('id', requestId).maybeSingle();
  if (!item || item.creator_id !== user.id) return NextResponse.json({ error: 'Somente o criador pode entregar este material.' }, { status: 403 });
  if (!['paid','in_production','delivered'].includes(item.status)) return NextResponse.json({ error: 'A entrega só pode ser enviada depois do pagamento.' }, { status: 409 });
  const body = await request.json() as Record<string, unknown>;
  const files = Array.isArray(body.files) ? body.files.filter(isDeliveryInput) : [];
  if (files.length !== 1) return NextResponse.json({ error: 'Escolha somente uma forma de entrega: um arquivo ou um link.' }, { status: 400 });
  const metadata = {
    title: String(body.title || item.title).trim(),
    description: String(body.description || '').trim(),
    educationYear: String(body.educationYear || '').trim(),
    theme: String(body.theme || '').trim(),
    tags: String(body.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean).slice(0, 20),
    pages: Math.max(0, Number(body.pages || 0)),
    fileFormat: String(body.fileFormat || '').trim(),
    coverUrl: typeof body.coverUrl === 'string' ? body.coverUrl : null,
  };
  if (!metadata.title || !metadata.description || !metadata.educationYear || !metadata.theme || !metadata.fileFormat) return NextResponse.json({ error: 'Preencha os dados essenciais do material antes de entregar.' }, { status: 400 });
  const rows = files.slice(0, 1).map((file) => ({ request_id: requestId, creator_id: user.id, file_name: String(file.name || 'material exclusivo'), file_url: file.url, content_type: String(file.contentType || ''), file_size: Number(file.size || 0), note: JSON.stringify(metadata) }));
  if (!rows.length) return NextResponse.json({ error: 'Arquivos inválidos.' }, { status: 400 });
  const { error } = await supabaseAdmin.from('exclusive_material_deliveries').insert(rows); if (error) throw error;
  await supabaseAdmin.from('exclusive_material_requests').update({ status: 'delivered', delivered_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', requestId);
  await supabaseAdmin.from('exclusive_material_notifications').insert({ customer_id: item.customer_id, request_id: requestId, type: 'delivered', title: 'Material exclusivo entregue', body: `Seu material “${item.title}” já está disponível para acessar.` });
  await supabaseAdmin.from('exclusive_material_messages').insert({ request_id: requestId, sender_id: user.id, sender_role: 'system', body: `Material exclusivo entregue: ${metadata.title}. O arquivo já está disponível em Meus Materiais e nesta solicitação.` });
  return NextResponse.json({ ok: true, libraryPath: `/cliente/loja/${item.store_id}` });
}
