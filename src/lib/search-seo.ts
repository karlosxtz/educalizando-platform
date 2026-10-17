import type { Metadata } from 'next';
import { PAGE_SEO, pageMetadata } from './page-seo';
import { SITE_URL } from './seo';

export function searchMetadata(params: Record<string, string | string[] | undefined>): Metadata {
  const category = typeof params.categoria === 'string' ? params.categoria : '';
  const path = category === 'ensino-fundamental' ? '/atividades-ensino-fundamental'
    : PAGE_SEO['/buscar?categoria=' + category] ? '/buscar?categoria=' + category : '/buscar';
  const metadata = pageMetadata(path);
  const arbitraryFilters = Object.entries(params).some(([key, value]) =>
    value && !['categoria', 'page', 'utm_source', 'utm_medium', 'utm_campaign', 'ref'].includes(key));
  const unknownCategory = !!category && path === '/buscar';
  const rawPage = typeof params.page === 'string' ? params.page : '';
  const page = /^\d+$/.test(rawPage) ? Number(rawPage) : 1;
  const index = !arbitraryFilters && !unknownCategory;
  // Search combinations are useful to visitors, but are not separate editorial pages.
  if (!index) metadata.robots = { index: false, follow: true };
  if (index && page > 1 && path !== '/atividades-ensino-fundamental') {
    const url = new URL(path, SITE_URL);
    url.searchParams.set('page', String(page));
    metadata.alternates = { canonical: url.href };
    metadata.title = { absolute: PAGE_SEO[path].title + ' — página ' + page + ' | Educalizando' };
    if (metadata.openGraph) metadata.openGraph = { ...metadata.openGraph, url: url.href };
  }
  return metadata;
}
