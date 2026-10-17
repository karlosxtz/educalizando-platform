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
    ...socialMetadata({ title, description: text, url, image: image || DEFAULT_SOCIAL_IMAGE, imageAlt: 'Capa de ' + name, preserveName: true }),
  };
}

export function productMetadata(product: Product, plr = false, _storefront?: Pick<Store, 'nome_loja' | 'slug'>, reference?: string): Metadata {
  const isPlr = plr && product.is_plr;
  const path = '/produto/' + encodeURIComponent(product.slug || product.id);
  const name = productSeoText(product.titulo);
  const description = productSearchDescription(product, isPlr, reference);
  const metadata = catalogMetadata(name, description, path,
    product.capa_url ? productCoverImageUrl(product.slug || product.id, product.capa_url) : DEFAULT_SOCIAL_IMAGE);
  // Both storefront and marketplace share one document identity. Store links,
  // affiliation, checkout, and license selection remain untouched.
  const title = shortSeoTitle(name + (reference ? ' · ' + reference : ''));
  return { ...metadata, title, description,
    openGraph: { ...metadata.openGraph, title, description },
    twitter: { ...metadata.twitter, title, description } };
}

/** A useful snippet, rather than spending its entire space repeating the title.
 * Only existing public fields are used; the creator's record is never changed. */
export function productSearchDescription(product: Product, plr = false, reference?: string) {
  const name = productSeoText(product.titulo);
  const detail = productSeoText(plr && product.plr_descricao ? product.plr_descricao : product.descricao || '');
  // A missing description is not permission to cut or invent a registered name.
  if (!detail) return name + (reference ? ' · Ref. ' + reference : '') + '.';
  const source = detail;
  const facts: string[] = [];
  if (!plr) {
    if (product.tipo === 'pdf' && !/\bpdf\b/i.test(source)) facts.push('PDF');
    if (Number.isInteger(product.page_count) && Number(product.page_count) > 0 && !/\bpáginas?\b/i.test(source)) {
      facts.push(`${product.page_count} ${product.page_count === 1 ? 'página' : 'páginas'}`);
    }
  }
  const ending = [...facts, ...(reference ? ['Ref. ' + reference] : [])].join(' · ');
  const room = 155 - (ending ? ending.length + 2 : 0);
  let excerpt = source;
  if (excerpt.length > room) {
    excerpt = excerpt.slice(0, Math.max(0, room - 1)).replace(/\s+\S*$/, '').trim();
    const sentence = excerpt.match(/^([\s\S]*[.!?])\s/);
    if (sentence && sentence[1].length >= Math.floor(room * 0.6)) excerpt = sentence[1];
  }
  excerpt = excerpt.replace(/[\s,;:–—-]+$/, '');
  if (excerpt && !/[.!?]$/.test(excerpt)) excerpt += '.';
  return excerpt + (ending ? ' ' + ending + '.' : '');
}

export function productStructuredData(product: Product, store: Pick<Store, 'nome_loja' | 'slug'>, plr = false, category?: string, _storefront = false) {
  const license = plr && product.is_plr;
  const url = SITE_URL + '/produto/' + encodeURIComponent(product.slug || product.id) + (license ? '?licenca=plr' : '');
  const value = license ? product.preco_plr : product.is_free ? 0 : product.preco;
  const price = value === null || value === undefined ? NaN : Number(value);
  const description = license && product.plr_descricao ? product.plr_descricao : product.descricao;
  return {
    '@context': 'https://schema.org', '@type': 'Product', '@id': url + '#product',
    name: product.titulo, description: productSeoText(description || '').slice(0, 5000) || productSeoDescription(product.titulo), url,
    sku: product.id, brand: { '@type': 'Brand', name: store.nome_loja },
    ...(product.capa_url ? { image: [productCoverImageUrl(product.slug || product.id, product.capa_url)] } : {}),
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
