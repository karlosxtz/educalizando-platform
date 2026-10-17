import { getServerSideSitemap } from 'next-sitemap';
import { readCatalogSitemapFields } from '@/lib/catalog-sitemap';

export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    return getServerSideSitemap(await readCatalogSitemapFields(), { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' });
  } catch {
    return new Response('Catálogo temporariamente indisponível', { status: 503, headers: { 'Retry-After': '300', 'Cache-Control': 'no-store' } });
  }
}
