import { directPublicImageUrl } from '@/lib/public-image-url';

/** Compatibility endpoint. No storage credentials, reads, buffers or transforms. */
export async function GET(request: Request) {
  const target = directPublicImageUrl(request.url);
  if (!target) return Response.json({ error: 'Imagem não encontrada.' }, { status: 404, headers: { 'Cache-Control': 'private, no-store' } });
  return new Response(null, { status: 302, headers: { Location: target, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
}
