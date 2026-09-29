import type { Metadata } from 'next';

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
};

export function socialMetadata({
  title,
  description,
  url,
  type = 'website',
  image = DEFAULT_SOCIAL_IMAGE,
  imageAlt = DEFAULT_SOCIAL_IMAGE_ALT,
}: SocialMetadataOptions): Pick<Metadata, 'openGraph' | 'twitter'> {
  return {
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

export function absoluteUrl(pathname: string) {
  return new URL(pathname, SITE_URL).toString();
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
