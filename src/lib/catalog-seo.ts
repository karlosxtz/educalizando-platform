import type { Metadata } from 'next';
import type { Product, Store, Kit } from './types';
import { SITE_URL, productCoverImageUrl, DEFAULT_SOCIAL_IMAGE, socialMetadata } from './seo';
import { productSeoDescription, productSeoText, shortSeoTitle } from './page-seo';

export function isIndexableProduct(product: Product | null): product is Product {
  return !!product && !product.excluido_em && ['publicado', 'ativo', 'published'].includes(product.status);
}

export function catalogMetadata(name: string, description: string | null, path: string, image?: string | null): Metadata {
  const title = shortSeoTitle(name);
  const text = productSeoDescription(name, description);
  const url = new URL(path, SITE_URL).href;
  return {
    metadataBase: new URL(SITE_URL), title, description: text, alternates: { canonical: url },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } },
    ...socialMetadata({ title, description: text, url, image: image || DEFAULT_SOCIAL_IMAGE, imageAlt: 'Capa de ' + name }),
  };
}

export function productMetadata(product: Product, plr = false, storefront?: Pick<Store, 'nome_loja' | 'slug'>, reference?: string): Metadata {
  const isPlr = plr && product.is_plr;
  const path = (storefront ? '/loja/' + encodeURIComponent(storefront.slug) : '') + '/produto/' + encodeURIComponent(product.slug || product.id);
  const context = (storefront ? `${storefront.nome_loja}: ` : 'Educalizando: ') + (reference ? `Ref. ${reference}. ` : '') + productSeoText(product.titulo).slice(0, 85) + '. ';
  const metadata = catalogMetadata(product.titulo, context + (isPlr && product.plr_descricao ? product.plr_descricao : product.descricao || ''),
    path,
    product.capa_url ? productCoverImageUrl(product.slug || product.id) : DEFAULT_SOCIAL_IMAGE);
  if (storefront || reference) {
    const suffix = storefront ? ' | Loja ' + storefront.nome_loja.slice(0, 15) : ' | Educalizando';
    const title = shortSeoTitle(product.titulo, (reference ? ' · ' + reference : '') + suffix);
    metadata.title = title;
    metadata.openGraph = { ...metadata.openGraph, title };
    metadata.twitter = { ...metadata.twitter, title };
  }
  return { ...metadata, metadataBase: new URL(SITE_URL) };
}

export function productStructuredData(product: Product, store: Pick<Store, 'nome_loja' | 'slug'>, plr = false, category?: string, storefront = false) {
  const license = plr && product.is_plr;
  const url = SITE_URL + (storefront ? '/loja/' + encodeURIComponent(store.slug) : '') + '/produto/' + encodeURIComponent(product.slug || product.id) + (license ? '?licenca=plr' : '');
  const value = license ? product.preco_plr : product.is_free ? 0 : product.preco;
  const price = value === null || value === undefined ? NaN : Number(value);
  const description = license && product.plr_descricao ? product.plr_descricao : product.descricao;
  return {
    '@context': 'https://schema.org', '@type': 'Product', '@id': url + '#product',
    name: product.titulo, description: productSeoText(description || '').slice(0, 5000) || productSeoDescription(product.titulo), url,
    sku: product.id, brand: { '@type': 'Brand', name: store.nome_loja },
    ...(product.capa_url ? { image: [productCoverImageUrl(product.slug || product.id)] } : {}),
    ...(category ? { category } : {}),
    ...(Number.isFinite(price) && price >= 0 ? { offers: {
      '@type': 'Offer', price: price.toFixed(2), priceCurrency: 'BRL',
      availability: 'https://schema.org/InStock', itemCondition: 'https://schema.org/NewCondition',
      url,
      seller: { '@type': 'Organization', name: store.nome_loja, url: SITE_URL + '/loja/' + encodeURIComponent(store.slug) },
    } } : {}),
    ...(Number(product.review_count) > 0 && Number(product.average_rating) >= 1 && Number(product.average_rating) <= 5 ? {
      aggregateRating: { '@type': 'AggregateRating', ratingValue: product.average_rating, reviewCount: product.review_count, bestRating: 5, worstRating: 1 },
    } : {}),
    additionalProperty: [
      ...(product.format_details ? [{ '@type': 'PropertyValue', name: 'Formato', value: product.format_details }] : []),
      ...(product.age_range ? [{ '@type': 'PropertyValue', name: 'Faixa etária', value: product.age_range }] : []),
      ...(product.page_count ? [{ '@type': 'PropertyValue', name: 'Páginas', value: product.page_count }] : []),
    ],
  };
}

export function kitStructuredData(kit: Kit, store: Pick<Store, 'nome_loja' | 'slug'>, path: string) {
  const url = new URL(path, SITE_URL).href;
  const price = Number(kit.preco_kit);
  return {
    '@context': 'https://schema.org', '@type': 'Product', '@id': url + '#product',
    name: kit.titulo, description: productSeoDescription(kit.titulo, kit.descricao), url, sku: kit.id,
    brand: { '@type': 'Brand', name: 'Educalizando' },
    ...(kit.capa_url ? { image: [kit.capa_url] } : {}),
    ...(kit.preco_kit != null && Number.isFinite(price) && price >= 0 ? { offers: {
      '@type': 'Offer', price: price.toFixed(2), priceCurrency: 'BRL', url,
      availability: 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: store.nome_loja, url: SITE_URL + '/loja/' + encodeURIComponent(store.slug) },
    } } : {}),
  };
}
