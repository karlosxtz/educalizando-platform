import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';

function deliveryMetadata(note: string | null) {
  if (!note) return {};
  try {
    const parsed = JSON.parse(note);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return { description: note };
  }
}

export async function GET(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  const storeId = new URL(request.url).searchParams.get('storeId');
  let query = supabaseAdmin
    .from('exclusive_material_requests')
    .select('id,title,store_id,delivered_at,store:stores(id,nome_loja,slug,logo_url,banner_url,cor_primaria,descricao),deliveries:exclusive_material_deliveries(id,file_name,file_url,content_type,file_size,note,created_at)')
    .eq('customer_id', user.id)
    .eq('status', 'delivered')
    .order('delivered_at', { ascending: false });

  if (storeId) query = query.eq('store_id', storeId);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Não foi possível carregar os materiais exclusivos.' }, { status: 500 });

  const materials = (data || []).map((item: any) => {
    const firstDelivery = item.deliveries?.[0];
    const metadata = deliveryMetadata(firstDelivery?.note || null) as Record<string, unknown>;
    return {
      id: item.id,
      requestId: item.id,
      storeId: item.store_id,
      title: String(metadata.title || item.title),
      description: String(metadata.description || ''),
      coverUrl: typeof metadata.coverUrl === 'string' ? metadata.coverUrl : null,
      educationYear: String(metadata.educationYear || ''),
      theme: String(metadata.theme || ''),
      tags: Array.isArray(metadata.tags) ? metadata.tags : [],
      pages: Number(metadata.pages || 0),
      fileFormat: String(metadata.fileFormat || firstDelivery?.content_type || ''),
      deliveredAt: item.delivered_at,
      store: item.store,
      files: (item.deliveries || []).map((delivery: any) => ({
        id: delivery.id,
        name: delivery.file_name,
        contentType: delivery.content_type,
        size: delivery.file_size,
        downloadUrl: `/api/exclusive-material/${item.id}/deliveries/${delivery.id}/download`,
      })),
    };
  });

  return NextResponse.json({ materials });
}
