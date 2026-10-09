import { getRequestUser } from '@/lib/api-auth';
import { platformPublicImageUrl,resolveBucket,uploadObject,type LegacyUploadBucket } from '@/lib/object-storage';
import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import sharp from 'sharp';
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
    const shouldOptimize = !['image/svg+xml', 'image/gif'].includes(fileValue.type);
    const body = shouldOptimize
      ? new Uint8Array(await sharp(source, { failOn: 'none' }).rotate().resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true }).webp({ quality: 84, effort: 4 }).toBuffer())
      : source;
    const contentType = shouldOptimize ? 'image/webp' : fileValue.type;
    const fileExtension = shouldOptimize ? 'webp' : extension(fileValue.name);
    const key = `uploads/${user.id}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${fileExtension}`;
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
