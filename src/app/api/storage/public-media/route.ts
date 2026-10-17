import { getObject } from '@/lib/object-storage';
import { NextResponse } from 'next/server';
import { directPublicImageUrl } from '@/lib/public-image-url';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const image = directPublicImageUrl(request.url);
  if (image) return new Response(null, { status: 302, headers: { Location: image, 'Cache-Control': 'private, no-store' } });
  const { searchParams } = new URL(request.url);
  const bucket = searchParams.get('bucket') || '';
  const key = searchParams.get('key') || '';
  const publicBucket = process.env.OBJECT_STORAGE_BUCKET_PUBLIC_IMAGES || 'public-images';
  if (bucket !== publicBucket || !key.startsWith('uploads/woocommerce/')) return NextResponse.json({ error: 'Mídia não encontrada.' }, { status: 404 });
  try {
    const object = await getObject(bucket, key);
    if (!object.Body) return NextResponse.json({ error: 'Mídia não encontrada.' }, { status: 404 });
    const contentType = object.ContentType || 'application/octet-stream';
    if (!/^(image|video)\//.test(contentType)) return NextResponse.json({ error: 'Mídia não encontrada.' }, { status: 404 });
    const headers: Record<string, string> = { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' };
    if (object.ContentLength !== undefined) headers['Content-Length'] = String(object.ContentLength);
    return new NextResponse(object.Body.transformToWebStream(), { headers });
  } catch (error) {
    console.error('[Storage] Erro ao ler mídia pública:', error);
    return NextResponse.json({ error: 'Mídia não encontrada.' }, { status: 404 });
  }
}
