import { getRequestUser } from '@/lib/api-auth';
import { createUploadUrl,publicObjectUrl,resolveBucket,type LegacyUploadBucket } from '@/lib/object-storage';
import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { materialObjectKey } from '@/lib/storage-object-name';

export const runtime = 'nodejs';

const uploadBuckets = new Set<LegacyUploadBucket>(['product-covers', 'product-files', 'plr-files', 'store-assets', 'student-avatars', 'main-banners']);
const maxUploadBytes = 15 * 1024 * 1024;

function extension(fileName: string) {
  const match = fileName.toLowerCase().match(/\.([a-z0-9]{1,10})$/);
  return match?.[1] || 'bin';
}

export async function POST(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: 'Autenticação obrigatória para enviar arquivos.' }, { status: 401 });

  try {
    const body = await request.json() as { bucket?: LegacyUploadBucket; fileName?: string; contentType?: string; size?: number; materialName?: string };
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
    const { data: store, error: storeError } = await supabaseAdmin.from('stores').select('nome_loja').eq('creator_id', user.id).maybeSingle();
    if (storeError) throw storeError;
    const key = materialObjectKey({ userId: user.id, creator: store?.nome_loja || user.user_metadata?.full_name || user.user_metadata?.name,
      material: body.materialName, fileName: body.fileName, id: randomUUID(), extension: extension(body.fileName) });
    const uploadUrl = await createUploadUrl({ bucket, key, contentType: body.contentType });
    const isPrivate = body.bucket === 'product-files' || body.bucket === 'plr-files';

    return NextResponse.json({
      uploadUrl,
      value: isPrivate ? `minio://${bucket}/${key}` : publicObjectUrl(bucket, key),
    });
  } catch (error) {
    console.error('[Storage] Erro ao preparar upload:', error);
    return NextResponse.json({ error: 'O armazenamento não está configurado corretamente.' }, { status: 503 });
  }
}
