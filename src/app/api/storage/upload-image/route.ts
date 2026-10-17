import { getRequestUser } from '@/lib/api-auth';
import { platformPublicImageUrl,resolveBucket,uploadObject,type LegacyUploadBucket } from '@/lib/object-storage';
import { randomUUID } from 'crypto';
import { materialObjectKey } from '@/lib/storage-object-name';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { optimizeProductImage } from '@/lib/product-image-optimizer';
import { consumeRequestRateLimit,rateLimitResponse } from '@/lib/request-rate-limit';

export const runtime = 'nodejs';

const imageBuckets = new Set<LegacyUploadBucket>(['product-covers', 'store-assets', 'student-avatars', 'main-banners']);
const maxImageBytes = 15 * 1024 * 1024;

function extension(fileName: string) {
  const match = fileName.toLowerCase().match(/\.([a-z0-9]{1,10})$/);
  return match?.[1] || 'webp';
}

export async function POST(request: Request) {
  const rateLimit = await consumeRequestRateLimit(request, { namespace: 'storage-image-upload', limit: 40, windowMs: 60 * 60 * 1000 });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit);
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: 'Sua sessão expirou. Entre novamente para enviar arquivos.' }, { status: 401 });

  try {
    const form = await request.formData();
    const bucketValue = form.get('bucket');
    const fileValue = form.get('file');
    if (typeof bucketValue !== 'string' || !imageBuckets.has(bucketValue as LegacyUploadBucket) || !(fileValue instanceof File)) {
      return NextResponse.json({ error: 'Dados da imagem inválidos.' }, { status: 400 });
    }
    if (!fileValue.type.startsWith('image/') || fileValue.size <= 0 || fileValue.size > maxImageBytes) {
      return NextResponse.json({ error: 'A imagem deve ter no máximo 15 MB.' }, { status: 400 });
    }
    if (fileValue.type === 'image/svg+xml') return NextResponse.json({ error: 'Envie uma imagem PNG, JPG, WEBP ou GIF.' }, { status: 400 });

    const bucket = resolveBucket(bucketValue as LegacyUploadBucket);
    const source = new Uint8Array(await fileValue.arrayBuffer());
    let shouldOptimize = false;
    let body: Uint8Array = source;
    if (!['image/svg+xml', 'image/gif'].includes(fileValue.type)) {
      try { body = await optimizeProductImage(source, true); shouldOptimize = true; }
      catch { /* No paid transformation: preserve original bytes and MIME type. */ }
    }
    const contentType = shouldOptimize ? 'image/webp' : fileValue.type;
    const fileExtension = shouldOptimize ? 'webp' : extension(fileValue.name);
    const { data: store, error: storeError } = await supabaseAdmin.from('stores').select('nome_loja').eq('creator_id', user.id).maybeSingle();
    if (storeError) throw storeError;
    const key = materialObjectKey({ userId: user.id, creator: store?.nome_loja || user.user_metadata?.full_name || user.user_metadata?.name,
      material: form.get('materialName'), fileName: fileValue.name, id: randomUUID(), extension: fileExtension });
    await uploadObject({
      bucket,
      key,
      body,
      contentType,
    });

    return NextResponse.json({ value: platformPublicImageUrl(bucket, key) });
  } catch (error) {
    console.error('[Storage] Erro ao enviar imagem:', error);
    return NextResponse.json({ error: 'Não foi possível gravar a imagem no armazenamento.' }, { status: 503 });
  }
}
