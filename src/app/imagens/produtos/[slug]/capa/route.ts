import { getObject } from '@/lib/object-storage';
import { SITE_URL } from '@/lib/seo';
import { getProductById } from '@/lib/store-service';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type CoverRouteContext = {
  params: Promise<{ slug: string }>;
};

function notFound() {
  return NextResponse.json({ error: 'Capa não encontrada.' }, { status: 404 });
}

function platformStorageLocation(value: string) {
  try {
    const url = new URL(value, SITE_URL);
    if (url.pathname !== '/api/storage/public-image') return null;

    const bucket = url.searchParams.get('bucket') || '';
    const key = url.searchParams.get('key') || '';
    const publicBucket = process.env.OBJECT_STORAGE_BUCKET_PUBLIC_IMAGES || 'public-images';

    if (bucket !== publicBucket || !key.startsWith('uploads/')) return null;
    return { bucket, key };
  } catch {
    return null;
  }
}

export async function GET(_request: Request, { params }: CoverRouteContext) {
  const { slug } = await params;
  const product = await getProductById(slug);
  if (!product?.capa_url || product.excluido_em || product.status !== 'publicado') return notFound();

  const storageLocation = platformStorageLocation(product.capa_url);
  if (!storageLocation) {
    try {
      return NextResponse.redirect(new URL(product.capa_url, SITE_URL), 307);
    } catch {
      return notFound();
    }
  }

  try {
    const object = await getObject(storageLocation.bucket, storageLocation.key);
    if (!object.Body) return notFound();

    const contentType = object.ContentType || 'application/octet-stream';
    if (!contentType.startsWith('image/')) return notFound();

    const bytes = new Uint8Array(await object.Body.transformToByteArray());
    return new NextResponse(bytes.buffer as ArrayBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
        'Content-Disposition': 'inline',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('[ProductCover] Não foi possível servir a capa pública:', error);
    return notFound();
  }
}
