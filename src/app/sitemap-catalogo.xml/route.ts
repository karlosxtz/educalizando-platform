import { getServerSideSitemap, type ISitemapField } from 'next-sitemap';
import { supabase } from '@/lib/supabase';
import { SITE_URL, productCoverImageUrl } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function GET() {
  const entries: ISitemapField[] = [];
  try {
    // Paginate around the database's default response limit of 1,000 rows.
    for (let offset = 0; offset < 5000; offset += 1000) {
      const { data, error } = await supabase.from('products')
        .select('id,slug,capa_url')
        .eq('status', 'publicado').is('excluido_em', null)
        .order('id').range(offset, offset + 999);
      if (error) throw error;
      for (const product of data || []) {
        const slug = product.slug || product.id;
        entries.push({
          loc: `${SITE_URL}/produto/${encodeURIComponent(slug)}`,
          changefreq: 'weekly', priority: 0.8,
          ...(product.capa_url ? { images: [{ loc: new URL(productCoverImageUrl(slug)) }] } : {}),
        });
      }
      if (!data || data.length < 1000) break;
    }
    for (let offset = 0; offset < 5000; offset += 1000) {
      const { data, error } = await supabase.from('stores').select('slug')
        .neq('slug', 'eduardoadmin').order('id').range(offset, offset + 999);
      if (error) throw error;
      for (const store of data || []) {
        if (store.slug) entries.push({
          loc: `${SITE_URL}/loja/${encodeURIComponent(store.slug)}`,
          changefreq: 'weekly', priority: 0.7,
        });
      }
      if (!data || data.length < 1000) break;
    }
    return getServerSideSitemap(entries, {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    });
  } catch (error) {
    console.error('[sitemap-catalogo] Falha ao consultar catálogo:', error);
    return new Response('Catálogo temporariamente indisponível', {
      status: 503,
      headers: { 'Retry-After': '300', 'Cache-Control': 'no-store' },
    });
  }
}
