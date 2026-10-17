import type { Metadata } from 'next';
import { directPublicImageUrl } from './public-image-url';

export const SITE_URL = 'https://www.educalizando.com.br';
export const DEFAULT_SOCIAL_IMAGE = '/branding/logo-og.png?v=3';
export const DEFAULT_SOCIAL_IMAGE_ALT = 'Educalizando — materiais didáticos digitais para professores';

type SocialMetadataOptions = {
  title: string;
  description: string;
  url: string;
  type?: 'website' | 'article';
  image?: string;
  imageAlt?: string;
  preserveName?: boolean;
};

export function socialMetadata({
  title,
  description,
  url,
  type = 'website',
  image = DEFAULT_SOCIAL_IMAGE,
  imageAlt = DEFAULT_SOCIAL_IMAGE_ALT,
  preserveName = false,
}: SocialMetadataOptions): Pick<Metadata, 'metadataBase' | 'title' | 'description' | 'alternates' | 'openGraph' | 'twitter'> {
  title = title.replace(/\s+/g, ' ').trim();
  if (!preserveName && title.length > 60 && title.endsWith(' | Educalizando')) title = title.slice(0, -' | Educalizando'.length);
  if (!preserveName) title = seoExcerpt(title, 60);
  description = seoExcerpt(description, 155);
  const path = new URL(url, SITE_URL);
  url = SITE_URL + path.pathname + path.search;
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: 'Educalizando',
      locale: 'pt_BR',
      type,
      images: [{ url: image, width: 1200, height: 630, alt: imageAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export function seoExcerpt(value: string, max = 155) {
  const text = value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  return text.slice(0, max - 1).replace(/\s+\S*$/, '').trimEnd() + '…';
}

export function absoluteUrl(pathname: string) {
  return new URL(pathname, SITE_URL).toString();
}

export function productCoverImageUrl(productSlugOrId: string, source?: string | null) {
  if (source) {
    const direct = directPublicImageUrl(source);
    if (direct) return direct;
    try {
      const url = new URL(source, SITE_URL);
      if (url.protocol === 'https:') return url.href;
    } catch { /* Preserve the historical resolver for invalid legacy references. */ }
  }
  return absoluteUrl(`/imagens/produtos/${encodeURIComponent(productSlugOrId)}/capa`);
}

/** Already-public registered images only: no signing, delivery files or proxies. */
export function productPublicImageUrls(product: {
  capa_url?: string | null;
  images?: { url: string; ordem?: number }[] | null;
}, limit = 7): string[] {
  const sources = [product.capa_url, ...[...(product.images || [])].sort((a, b) => (a.ordem || 0) - (b.ordem || 0)).map(image => image.url)];
  const urls = new Set<string>();
  for (const source of sources) {
    if (!source) continue;
    try {
      const direct = directPublicImageUrl(source);
      const url = new URL(direct || source);
      if (url.protocol !== 'https:' || url.username || url.password || url.hash) continue;
      if (!/\.(png|jpe?g|webp|gif|avif|svg)$/i.test(url.pathname)) continue;
      if (/\/(?:private[^/]*|sign|authenticated)(?:\/|$)/i.test(url.pathname)) continue;
      if (Array.from(url.searchParams.keys()).some(key => /^(x-amz-|x-goog-|signature$|token$)/i.test(key))) continue;
      if (url.hostname === 'arquivos.educalizando.com.br' && !url.pathname.startsWith('/public-images/uploads/')) continue;
      if (/^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(url.hostname)) continue;
      urls.add(url.href);
      if (urls.size >= Math.max(1, Math.min(limit, 7))) break;
    } catch { /* Invalid legacy references cannot leak into image discovery. */ }
  }
  return [...urls];
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
