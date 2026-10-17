import type { MetadataRoute } from 'next';
import { readCatalogSitemapFields } from '@/lib/catalog-sitemap';
import { SCHOOL_CALENDAR_EVENTS } from '@/lib/school-calendar';
import { glossaryTerms } from '@/lib/glossary';
import { seoLandings } from '@/lib/seo-landings';
import { SITE_URL } from '@/lib/seo';

export const revalidate = 300;

const PUBLIC_SITEMAP_PATHS = [
  '/', '/sobre', '/lojas', '/buscar', '/ofertas', '/materiais-gratis',
  '/blog', '/calendario', '/glossario', '/atividades-por-ano',
  '/ajuda', '/termos', '/privacidade', '/afiliados',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const catalog = await readCatalogSitemapFields();
  const staticPaths = [
    ...PUBLIC_SITEMAP_PATHS,
    ...Object.keys(seoLandings).map(slug => '/' + slug),
    ...SCHOOL_CALENDAR_EVENTS.map(event => '/calendario/' + event.slug),
    ...glossaryTerms.map(term => '/glossario/' + term.slug),
  ];
  const entries: MetadataRoute.Sitemap = [
    ...staticPaths.map(path => ({ url: SITE_URL + (path === '/' ? '' : path) })),
    ...catalog.map(entry => ({
      url: entry.loc,
      ...(entry.lastmod ? { lastModified: entry.lastmod } : {}),
      ...(entry.images?.length ? { images: entry.images.map(image => String(image.loc)) } : {}),
    })),
  ];
  const unique = [...new Map(entries.map(entry => [entry.url, entry])).values()];
  if (unique.length > 50000) throw new Error('O catálogo precisa de sitemaps particionados; nenhuma URL foi truncada.');
  return unique;
}
