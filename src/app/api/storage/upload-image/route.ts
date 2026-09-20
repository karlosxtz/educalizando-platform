import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getRequestUser } from '@/lib/api-auth';
import { platformPublicImageUrl, resolveBucket, uploadObject, type LegacyUploadBucket } from '@/lib/object-storage';

export const runtime = 'nodejs';

const imageBuckets = new Set<LegacyUploadBucket>(['product-covers', 'store-assets', 'student-avatars', 'main-banners']);
const maxImageBytes = 15 * 1024 * 1024;

function extension(fileName: string) {
  const match = fileName.toLowerCase().match(/\.([a-z0-9]{1,10})$/);
  return match?.[1] || 'webp';
}

export async function POST(request: Request) {
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

    const bucket = resolveBucket(bucketValue as LegacyUploadBucket);
    const key = `uploads/${user.id}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extension(fileValue.name)}`;
    await uploadObject({
      bucket,
      key,
      body: new Uint8Array(await fileValue.arrayBuffer()),
      contentType: fileValue.type,
    });

    return NextResponse.json({ value: platformPublicImageUrl(bucket, key) });
  } catch (error) {
    console.error('[Storage] Erro ao enviar imagem:', error);
    return NextResponse.json({ error: 'Não foi possível gravar a imagem no armazenamento.' }, { status: 503 });
  }
}
