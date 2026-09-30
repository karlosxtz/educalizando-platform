import { MetadataRoute } from 'next';
import { getAllPublicStores, getAllPublicMarketplaceProducts } from '@/lib/store-service';
import { getCategories, getEducationLevels } from '@/lib/category-service';
import { getDisciplines } from '@/lib/discipline-service';
import { getPublishedBlogPosts } from '@/lib/blog-service';
import { glossaryTerms } from '@/lib/glossary';
import { seoLandings } from '@/lib/seo-landings';
import { SCHOOL_CALENDAR_EVENTS } from '@/lib/school-calendar';

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
      url: `${baseUrl}/cadastro/produtor`,
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
    { url: `${baseUrl}/calendario`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/atividades-por-ano`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.75 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
  ];

  glossaryTerms.forEach((term) => sitemapEntries.push({ url: `${baseUrl}/glossario/${term.slug}`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 }));
  SCHOOL_CALENDAR_EVENTS.forEach((event) => sitemapEntries.push({ url: `${baseUrl}/calendario/${event.slug}`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.55 }));
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
    // Não enviamos páginas de coleção vazias: elas exibem apenas um estado de
    // ausência de produtos e diluem o orçamento de rastreamento do Google.
    // Assim que um criador publicar um material na categoria ou nível, a URL
    // passa a entrar automaticamente no sitemap na próxima leitura.
    const categoryIdsWithProducts = new Set(
      products.flatMap((product) => product.category_ids?.length ? product.category_ids : product.category_id ? [product.category_id] : []),
    );
    const educationLevelIdsWithProducts = new Set(
      products.flatMap((product) => product.education_level_ids?.length ? product.education_level_ids : product.education_level_id ? [product.education_level_id] : []),
    );

    categories.filter((category) => categoryIdsWithProducts.has(category.id)).forEach((category) => {
      if (!category.slug) return;
      sitemapEntries.push({
        url: `${baseUrl}/categorias/${category.slug}`,
        lastModified: category.created_at ? new Date(category.created_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.75,
      });
    });

    educationLevels.filter((level) => educationLevelIdsWithProducts.has(level.id)).forEach((level) => {
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

    blogPosts.forEach((post) => {
      sitemapEntries.push({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: new Date(post.updated_at || post.published_at || post.created_at),
        changeFrequency: 'monthly',
        priority: 0.65,
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
      });
    });
  } catch (error) {
    console.error('Erro ao gerar sitemap dinâmico:', error);
  }

  // Uma URL canônica deve aparecer uma única vez, mesmo que uma futura fonte
  // dinâmica coincida com uma landing editorial já cadastrada acima.
  return Array.from(new Map(sitemapEntries.map((entry) => [entry.url, entry])).values());
}
