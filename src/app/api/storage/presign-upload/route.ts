import { getRequestUser } from '@/lib/api-auth';
import { createUploadUrl,platformPublicImageUrl,resolveBucket,uploadCacheControl } from '@/lib/object-storage';
import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { materialObjectKey } from '@/lib/storage-object-name';
import { validateUploadMetadata } from '@/lib/direct-storage-upload';
import { consumeRequestRateLimit,rateLimitResponse } from '@/lib/request-rate-limit';

export const runtime = 'nodejs';

function extension(fileName: string) {
  const match = fileName.toLowerCase().match(/\.([a-z0-9]{1,10})$/);
  return match?.[1] || 'bin';
}

export async function POST(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: 'Autenticação obrigatória para enviar arquivos.' }, { status: 401 });

  const rateLimit = await consumeRequestRateLimit(request, { namespace: 'storage-direct-upload', limit: 150, windowMs: 60 * 60 * 1000 });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

  let body;
  try {
    body = validateUploadMetadata(await request.json());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Dados do arquivo inválidos.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }

  try {
    const bucket = resolveBucket(body.bucket);
    const { data: store, error: storeError } = await supabaseAdmin.from('stores').select('nome_loja').eq('creator_id', user.id).maybeSingle();
    if (storeError) throw storeError;
    const key = materialObjectKey({ userId: user.id, creator: store?.nome_loja || user.user_metadata?.full_name || user.user_metadata?.name,
      material: body.materialName, fileName: body.fileName, id: randomUUID(), extension: extension(body.fileName) });
    const uploadUrl = await createUploadUrl({ bucket, key, contentType: body.contentType, size: body.size });
    const isPrivate = body.bucket === 'product-files' || body.bucket === 'plr-files';

    return NextResponse.json({
      uploadUrl,
      value: isPrivate ? `minio://${bucket}/${key}` : platformPublicImageUrl(bucket, key),
      uploadHeaders: { 'Content-Type': body.contentType, 'Cache-Control': uploadCacheControl(bucket) },
      expiresIn: 15 * 60,
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('[Storage] Erro ao preparar upload:', error);
    return NextResponse.json({ error: 'O armazenamento não está configurado corretamente.' }, { status: 503 });
  }
}

