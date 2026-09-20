import { NextResponse } from 'next/server';
import { getObject } from '@/lib/object-storage';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bucket = searchParams.get('bucket') || '';
  const key = searchParams.get('key') || '';
  const publicBucket = process.env.OBJECT_STORAGE_BUCKET_PUBLIC_IMAGES || 'public-images';

  // Esta rota serve apenas imagens públicas geradas pela plataforma.
  if (bucket !== publicBucket || !key.startsWith('uploads/')) {
    return NextResponse.json({ error: 'Imagem não encontrada.' }, { status: 404 });
  }

  try {
    const object = await getObject(bucket, key);
    if (!object.Body) return NextResponse.json({ error: 'Imagem não encontrada.' }, { status: 404 });

    const contentType = object.ContentType || 'application/octet-stream';
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'O arquivo solicitado não é uma imagem.' }, { status: 404 });
    }

    const bytes = new Uint8Array(await object.Body.transformToByteArray());
    return new NextResponse(bytes.buffer as ArrayBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('[Storage] Erro ao ler imagem pública:', error);
    return NextResponse.json({ error: 'Imagem não encontrada.' }, { status: 404 });
  }
}
