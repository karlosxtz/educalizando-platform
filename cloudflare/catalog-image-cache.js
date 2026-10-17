import { directPublicImageUrl } from '../src/lib/public-image-url.ts';

/** Backward-compatible redirect only: public image bytes never cross this Worker. */
export async function catalogImageResponse(request) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/media/catalogo/')) return null;
  if (!['GET', 'HEAD'].includes(request.method)) return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
  const recovery = url.searchParams.size === 1 && url.searchParams.get('image_retry') === '1';
  const target = directPublicImageUrl(request.url);
  if (!target || (url.search && !recovery)) return new Response(null, { status: 404 });
  return new Response(null, { status: 301, headers: {
    Location: target, 'Cache-Control': 'public, max-age=86400', 'X-Content-Type-Options': 'nosniff',
  } });
}
