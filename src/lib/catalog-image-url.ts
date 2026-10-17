import { normalizePublicAssetUrl } from './public-links';
import { publicImageObjectUrl } from './public-image-url';

/** Public images only. Uploads and private delivery URLs retain their own paths. */
export function catalogImageUrl(value: string | null | undefined): string | null {
  const normalized = normalizePublicAssetUrl(value);
  if (!normalized) return null;
  try {
    const url = new URL(normalized, 'https://www.educalizando.com.br');
    if (url.origin !== 'https://arquivos.educalizando.com.br' || url.search || !url.pathname.startsWith('/public-images/')) return normalized;
    const key = decodeURIComponent(url.pathname.slice('/public-images/'.length));
    const direct = publicImageObjectUrl('public-images', key);
    return direct || normalized;
  } catch { return normalized; }
}
