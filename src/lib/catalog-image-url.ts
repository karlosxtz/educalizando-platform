import { normalizePublicAssetUrl } from './public-links';
import { publicImageObjectUrl } from './public-image-url';
import previewManifest from './minio-preview-manifest.json';
import staticPreviewManifest from './catalog-preview-manifest.json';

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

/** Only generated and publicly verified previews enter this manifest. */
export function catalogThumbnailUrl(value: string | null | undefined): string | null {
  const original = catalogImageUrl(value);
  if (!original) return null;
  try {
    const url = new URL(original);
    // The VPS writes both variants before returning an optimized image URL.
    if(url.origin==='https://arquivos.educalizando.com.br'&&!url.search&&!url.hash&&/^\/public-images\/uploads\/optimized\/v1\/(platform|woocommerce)\/[a-zA-Z0-9-]+\/[a-zA-Z0-9-]+\/\d+-[a-f0-9]{24}\/full\.webp$/.test(url.pathname))return url.href.replace('/full.webp','/thumb.webp');
    // Existing previews are explicitly verified in MinIO before publication.
    const staticHash = !url.search && !url.hash && (staticPreviewManifest as Record<string, string>)[url.href];
    if (staticHash && /^[a-f0-9]{32}$/.test(staticHash)) return `https://arquivos.educalizando.com.br/public-images/uploads/previews/v1/${staticHash}.webp`;
    if (url.origin !== 'https://arquivos.educalizando.com.br' || url.search) return original;
    const hash = (previewManifest as Record<string, string>)[decodeURIComponent(url.pathname)];
    return hash && /^[a-f0-9]{32}$/.test(hash)
      ? `https://arquivos.educalizando.com.br/public-images/uploads/previews/v1/${hash}.webp`
      : original;
  } catch { return original; }
}
