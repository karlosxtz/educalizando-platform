import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getRequestUser } from '@/lib/api-auth';
import { createUploadUrl, publicObjectUrl, resolveBucket, type LegacyUploadBucket } from '@/lib/object-storage';

export const runtime = 'nodejs';

const uploadBuckets = new Set<LegacyUploadBucket>(['product-covers', 'product-files', 'store-assets', 'student-avatars', 'main-banners']);
const maxUploadBytes = 15 * 1024 * 1024;

function extension(fileName: string) {
  const match = fileName.toLowerCase().match(/\.([a-z0-9]{1,10})$/);
  return match?.[1] || 'bin';
}

export async function POST(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: 'Autenticação obrigatória para enviar arquivos.' }, { status: 401 });

  try {
    const body = await request.json() as { bucket?: LegacyUploadBucket; fileName?: string; contentType?: string; size?: number };
    if (!body.bucket || !uploadBuckets.has(body.bucket) || !body.fileName || !body.contentType || !Number.isFinite(body.size)) {
      return NextResponse.json({ error: 'Dados do arquivo inválidos.' }, { status: 400 });
    }
    const fileSize = body.size;
    if (fileSize === undefined || fileSize <= 0 || fileSize > maxUploadBytes) {
      return NextResponse.json({ error: 'O arquivo deve ter no máximo 15 MB.' }, { status: 400 });
    }
    if (body.contentType.startsWith('video/')) {
      return NextResponse.json({ error: 'O envio de vídeos não é permitido.' }, { status: 400 });
    }
    if (body.bucket !== 'product-files' && !body.contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'Este campo aceita somente imagens.' }, { status: 400 });
    }

    const bucket = resolveBucket(body.bucket);
    const key = `uploads/${user.id}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extension(body.fileName)}`;
    const uploadUrl = await createUploadUrl({ bucket, key, contentType: body.contentType });
    const isPrivate = body.bucket === 'product-files';

    return NextResponse.json({
      uploadUrl,
      value: isPrivate ? `minio://${bucket}/${key}` : publicObjectUrl(bucket, key),
    });
  } catch (error) {
    console.error('[Storage] Erro ao preparar upload:', error);
    return NextResponse.json({ error: 'O armazenamento não está configurado corretamente.' }, { status: 503 });
  }
}
