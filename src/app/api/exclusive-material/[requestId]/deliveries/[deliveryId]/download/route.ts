import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { createDownloadUrl, parsePrivateStorageUri } from '@/lib/object-storage';
export async function GET(request: Request, { params }: { params: Promise<{ requestId: string; deliveryId: string }> }) {
  const user = await getRequestUser(request); const { requestId, deliveryId } = await params;
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const { data: item } = await supabaseAdmin.from('exclusive_material_requests').select('customer_id, creator_id').eq('id', requestId).maybeSingle();
  if (!item || (item.customer_id !== user.id && item.creator_id !== user.id)) return NextResponse.json({ error: 'Sem acesso.' }, { status: 403 });
  const { data: delivery } = await supabaseAdmin.from('exclusive_material_deliveries').select('file_name,file_url').eq('id', deliveryId).eq('request_id', requestId).maybeSingle();
  if (!delivery) return NextResponse.json({ error: 'Arquivo não encontrado.' }, { status: 404 });
  const privateUri = parsePrivateStorageUri(delivery.file_url);
  if (!privateUri) return NextResponse.redirect(delivery.file_url);
  return NextResponse.redirect(await createDownloadUrl(privateUri.bucket, privateUri.key, delivery.file_name));
}
