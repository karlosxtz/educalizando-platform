import type { ISitemapField } from 'next-sitemap';
import { supabase as db } from '@/lib/supabase';
import { SITE_URL, productCoverImageUrl } from '@/lib/seo';
import { collectSitemapRows } from '@/lib/sitemap-pagination';

export async function readCatalogSitemapFields(): Promise<ISitemapField[]> {
    const [products, stores, kits, clubs, posts, categories, levels] = await Promise.all([
      collectSitemapRows((from, to) => db.from('products').select('id,store_id,slug,capa_url,category_id,category_ids,education_level_id,education_level_ids,created_at,updated_at').in('status', ['publicado', 'ativo', 'published']).is('excluido_em', null).order('id').range(from, to)),
      collectSitemapRows((from, to) => db.from('stores').select('id,slug,created_at,updated_at').neq('slug', 'eduardoadmin').order('id').range(from, to)),
      collectSitemapRows((from, to) => db.from('kits').select('id,created_at,updated_at').eq('status', 'publicado').is('excluido_em', null).order('id').range(from, to)),
      collectSitemapRows((from, to) => db.from('creator_clubs').select('slug,created_at,updated_at').eq('status', 'published').order('id').range(from, to)),
      collectSitemapRows((from, to) => db.from('blog_posts').select('slug,created_at,updated_at,published_at').eq('status', 'published').lte('published_at', new Date().toISOString()).order('id').range(from, to)),
      collectSitemapRows((from, to) => db.from('categories').select('id,slug,created_at').is('store_id', null).order('id').range(from, to)),
      collectSitemapRows((from, to) => db.from('education_levels').select('id,slug,created_at').order('id').range(from, to)),
    ]);
    // Visibility comes from the same public RLS as the storefront, never a privileged client.
    const visibleStoreIds = new Set(stores.filter(store => store.slug).map(store => store.id));
    const publicProducts = products.filter(product => visibleStoreIds.has(product.store_id));
    const categoryIds = new Set(publicProducts.flatMap(product => [...(product.category_ids || []), product.category_id].filter(Boolean)));
    const levelIds = new Set(publicProducts.flatMap(product => [...(product.education_level_ids || []), product.education_level_id].filter(Boolean)));
    const lastmod = (value: string | null): Pick<ISitemapField, 'lastmod'> => value && !Number.isNaN(Date.parse(value)) ? { lastmod: new Date(value).toISOString() } : {};
    const entries: ISitemapField[] = [
      ...publicProducts.map(product => ({
        loc: SITE_URL + '/produto/' + encodeURIComponent(product.slug || product.id),
        ...lastmod(product.updated_at || product.created_at),
        ...(product.capa_url ? { images: [{ loc: new URL(productCoverImageUrl(product.slug || product.id)) }] } : {}),
      })),
      ...publicProducts.map(product => ({
        loc: SITE_URL + '/loja/' + encodeURIComponent(stores.find(store => store.id === product.store_id)!.slug) + '/produto/' + encodeURIComponent(product.slug || product.id),
        ...lastmod(product.updated_at || product.created_at),
      })),
      ...stores.filter(store => store.slug).map(store => ({ loc: SITE_URL + '/loja/' + encodeURIComponent(store.slug), ...lastmod(store.updated_at || store.created_at) })),
      ...kits.map(kit => ({ loc: SITE_URL + '/kit/' + encodeURIComponent(kit.id), ...lastmod(kit.updated_at || kit.created_at) })),
      ...clubs.filter(club => club.slug).map(club => ({ loc: SITE_URL + '/clube/' + encodeURIComponent(club.slug), ...lastmod(club.updated_at || club.created_at) })),
      ...posts.filter(post => post.slug).map(post => ({ loc: SITE_URL + '/blog/' + encodeURIComponent(post.slug), ...lastmod(post.updated_at || post.published_at || post.created_at) })),
      ...categories.filter(category => category.slug && categoryIds.has(category.id)).map(category => ({ loc: SITE_URL + '/categorias/' + encodeURIComponent(category.slug), ...lastmod(category.created_at) })),
      ...levels.filter(level => level.slug && levelIds.has(level.id)).map(level => ({ loc: SITE_URL + '/atividades-por-ano/' + encodeURIComponent(level.slug), ...lastmod(level.created_at) })),
    ];
    const unique = [...new Map(entries.map(entry => [entry.loc, entry])).values()];
    if (unique.length > 50000) throw new Error('Dividir catálogo em múltiplos sitemaps.');
    return unique;
}
