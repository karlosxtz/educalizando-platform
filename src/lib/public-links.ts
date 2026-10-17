import { SITE_URL } from './seo';
import { publicImageObjectUrl, directPublicImageUrl } from './public-image-url';

function isLocalHost(host: string) {
  return ['localhost', '127.0.0.1', '0.0.0.0', '[::1]'].includes(host.toLowerCase());
}

/** Production links always identify the public platform, never the build computer. */
export function publicSiteOrigin(configured?: string, mode = process.env.NODE_ENV) {
  if (mode === 'development' && configured) {
    try {
      const url = new URL(configured);
      if (['http:', 'https:'].includes(url.protocol) && isLocalHost(url.hostname)) return url.origin;
    } catch { /* Invalid configuration cannot become a public link. */ }
  }
  return SITE_URL;
}

export function publicStoreUrl(slug: string) {
  return SITE_URL + '/loja/' + encodeURIComponent(slug || 'sua-loja');
}

/** Recover old public-image addresses without altering private delivery paths. */
export function normalizePublicAssetUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const raw = value.trim();
  if (!raw) return null;
  const directImage = directPublicImageUrl(raw);
  if (directImage) return directImage;
  try {
    const url = new URL(raw, SITE_URL);
    const local = isLocalHost(url.hostname);
    const platform = ['educalizando.com.br', 'www.educalizando.com.br'].includes(url.hostname);
    if ((local || platform) && /^\/api\/storage\/public-(image|media)$/.test(url.pathname)) {
      if (url.pathname === '/api/storage/public-image') {
        const direct = publicImageObjectUrl(url.searchParams.get('bucket') || '', url.searchParams.get('key') || '');
        if (direct) return direct;
      }
      return SITE_URL + url.pathname + url.search;
    }
    // Public objects formerly stored as direct local MinIO addresses.
    if (local && url.pathname.startsWith('/public-images/')) {
      const key = decodeURIComponent(url.pathname.slice('/public-images/'.length));
      const direct = publicImageObjectUrl('public-images', key);
      if (direct) return direct;
    }
  } catch { /* Keep existing external and private references unchanged. */ }
  return raw;
}
