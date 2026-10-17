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

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
