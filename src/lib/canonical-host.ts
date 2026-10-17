import { SITE_URL } from './seo';

/** Run before page/image caching. Local development and integration POSTs keep their endpoints. */
export function canonicalHostRedirect(request: Request): Response | null {
  if (!['GET', 'HEAD'].includes(request.method)) return null;
  const url = new URL(request.url);
  const alternate = url.hostname === 'educalizando.com.br'
    || /\.(?:vercel\.app|workers\.dev|pages\.dev)$/i.test(url.hostname);
  if (!alternate) return null;
  return new Response(null, { status: 301, headers: {
    Location: SITE_URL + url.pathname + url.search,
    'Cache-Control': 'public, max-age=3600',
  } });
}
