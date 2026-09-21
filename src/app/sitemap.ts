import { MetadataRoute } from 'next';
import { getAllPublicStores, getAllPublicMarketplaceProducts } from '@/lib/store-service';
import { getCategories, getEducationLevels } from '@/lib/category-service';
import { getDisciplines } from '@/lib/discipline-service';
import { getPublishedBlogPosts } from '@/lib/blog-service';
import { glossaryTerms } from '@/lib/glossary';
import { seoLandings } from '@/lib/seo-landings';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Must match the canonical host configured in the root metadata.
  const baseUrl = 'https://www.educalizando.com.br';

  const sitemapEntries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/vender`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/lojas`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/materiais-gratis`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/materiais-didaticos`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/ofertas`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/sobre`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/ajuda`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/afiliados`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    { url: `${baseUrl}/glossario`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  ];

  glossaryTerms.forEach((term) => sitemapEntries.push({ url: `${baseUrl}/glossario/${term.slug}`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 }));
  Object.values(seoLandings).forEach((landing) => sitemapEntries.push({ url: `${baseUrl}/${landing.slug}`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 }));

  try {
    const [stores, products, categories, educationLevels, disciplines, blogPosts] = await Promise.all([
      getAllPublicStores(),
      getAllPublicMarketplaceProducts(5000),
      getCategories(),
      getEducationLevels(),
      getDisciplines(),
      getPublishedBlogPosts(5000),
    ]);

    // Páginas de descoberta permanentes: importantes para quem pesquisa por
    // disciplina ou etapa de ensino, mesmo antes de conhecer uma loja.
    categories.forEach((category) => {
      if (!category.slug) return;
      sitemapEntries.push({
        url: `${baseUrl}/categorias/${category.slug}`,
        lastModified: category.created_at ? new Date(category.created_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.75,
      });
    });

    educationLevels.forEach((level) => {
      if (!level.slug) return;
      sitemapEntries.push({
        url: `${baseUrl}/atividades-por-ano/${level.slug}`,
        lastModified: level.created_at ? new Date(level.created_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.75,
      });
    });

    disciplines.forEach((discipline) => {
      sitemapEntries.push({
        url: `${baseUrl}/disciplinas/${discipline.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.75,
      });
    });

    sitemapEntries.push({ url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 });
    blogPosts.forEach((post) => {
      sitemapEntries.push({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: new Date(post.updated_at || post.published_at || post.created_at),
        changeFrequency: 'monthly',
        priority: 0.65,
        ...(post.cover_url ? { images: [post.cover_url] } : {}),
      });
    });

    // Busca todas as lojas públicas
    stores.forEach((store) => {
      sitemapEntries.push({
        url: `${baseUrl}/loja/${store.slug}`,
        lastModified: store.updated_at || store.created_at ? new Date(store.updated_at || store.created_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
      });
    });

    // Busca todos os produtos do marketplace.
    // 5000 é um limite seguro para o sitemap sem precisar paginar.
    products.forEach((product) => {
      sitemapEntries.push({
        // IDs are retained only to redirect old links; only canonical slugs
        // should be submitted to search engines.
        url: `${baseUrl}/produto/${product.slug || product.id}`,
        lastModified: product.updated_at || product.created_at ? new Date(product.updated_at || product.created_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
        ...(product.capa_url ? { images: [product.capa_url] } : {}),
      });
    });
  } catch (error) {
    console.error('Erro ao gerar sitemap dinâmico:', error);
  }

  return sitemapEntries;
}
