import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { createDownloadUrl, parsePrivateStorageUri } from '@/lib/object-storage';

type ExclusiveDeliveryRow = {
  id: string;
  file_name: string;
  file_url: string;
  content_type: string | null;
  file_size: number | null;
  note: string | null;
  created_at: string;
};

type ExclusiveMaterialRow = {
  id: string;
  title: string;
  store_id: string;
  delivered_at: string | null;
  store: unknown;
  deliveries: ExclusiveDeliveryRow[] | null;
};

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

  const rows = (data || []) as unknown as ExclusiveMaterialRow[];
  const materials = await Promise.all(rows.map(async (item) => {
    const deliveries = [...(item.deliveries || [])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const firstDelivery = deliveries.find((delivery) => Boolean(parsePrivateStorageUri(delivery.file_url))) || deliveries[0];
    const metadata = deliveryMetadata(firstDelivery?.note || null) as Record<string, unknown>;
    const rawCoverUrl = typeof metadata.coverUrl === 'string' ? metadata.coverUrl : null;
    const privateCover = parsePrivateStorageUri(rawCoverUrl || '');
    let coverUrl = rawCoverUrl;
    if (privateCover) {
      try {
        coverUrl = await createDownloadUrl(privateCover.bucket, privateCover.key, 'capa-material-exclusivo');
      } catch {
        coverUrl = null;
      }
    }
    return {
      id: item.id,
      requestId: item.id,
      storeId: item.store_id,
      title: String(metadata.title || item.title),
      description: String(metadata.description || ''),
      coverUrl,
      educationYear: String(metadata.educationYear || ''),
      theme: String(metadata.theme || ''),
      tags: Array.isArray(metadata.tags) ? metadata.tags : [],
      pages: Number(metadata.pages || 0),
      fileFormat: String(metadata.fileFormat || firstDelivery?.content_type || ''),
      deliveredAt: item.delivered_at,
      store: item.store,
      files: firstDelivery ? [{
        id: firstDelivery.id,
        name: firstDelivery.file_name,
        contentType: firstDelivery.content_type,
        size: firstDelivery.file_size,
        downloadUrl: `/api/exclusive-material/${item.id}/deliveries/${firstDelivery.id}/download`,
      }] : [],
    };
  }));

  return NextResponse.json({ materials });
}
