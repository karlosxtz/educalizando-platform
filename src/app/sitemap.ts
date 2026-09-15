import { MetadataRoute } from 'next';
import { getAllPublicStores, getAllPublicMarketplaceProducts } from '@/lib/store-service';
import { getCategories, getEducationLevels } from '@/lib/category-service';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://educalizando.com.br';

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
  ];

  try {
    const [stores, products, categories, educationLevels] = await Promise.all([
      getAllPublicStores(),
      getAllPublicMarketplaceProducts(5000),
      getCategories(),
      getEducationLevels(),
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

    // Busca todas as lojas públicas
    stores.forEach((store) => {
      sitemapEntries.push({
        url: `${baseUrl}/loja/${store.slug}`,
        lastModified: store.created_at ? new Date(store.created_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
      });
    });

    // Busca todos os produtos do marketplace.
    // 5000 é um limite seguro para o sitemap sem precisar paginar.
    products.forEach((product) => {
      sitemapEntries.push({
        url: `${baseUrl}/produto/${product.id}`,
        lastModified: product.created_at ? new Date(product.created_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    });
  } catch (error) {
    console.error('Erro ao gerar sitemap dinâmico:', error);
  }

  return sitemapEntries;
}
