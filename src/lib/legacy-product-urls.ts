import { SITE_URL } from './seo';

// Search Console URLs returning 404 on 17/10/2026. Destinations were checked
// against the published product, ID and owner; never infer matches at runtime.
export const LEGACY_PRODUCT_URLS: Record<string, string> = {
  'arte-primavera-y66a': 'arte-primavera',
  'caixa-das-frases-40-frases-em-letra-cursiva-e-letra-bastao-62ce': 'caixa-das-frases-40-frases-em-letra-cursiva-e-letra-bastao',
  'lap-book-interativo-renascimento': 'lap-book-interativo-renascimento-7-ano',
};

export function legacyProductRedirect(request: Request): Response | null {
  if (!['GET', 'HEAD'].includes(request.method)) return null;
  const url = new URL(request.url);
  const match = /^\/produto\/([^/]+)\/?$/.exec(url.pathname);
  if (!match) return null;
  const slug = Object.hasOwn(LEGACY_PRODUCT_URLS, match[1]) ? LEGACY_PRODUCT_URLS[match[1]] : undefined;
  if (!slug) return null;
  const target = new URL('/produto/' + encodeURIComponent(slug), SITE_URL);
  target.search = url.search;
  return new Response(null, { status: 301, headers: { Location: target.href } });
}
