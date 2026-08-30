import { MetadataRoute } from 'next';
import { getAllPublicStores, getAllPublicMarketplaceProducts } from '@/lib/store-service';

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
    // Busca todas as lojas públicas
    const stores = await getAllPublicStores();
    stores.forEach((store) => {
      sitemapEntries.push({
        url: `${baseUrl}/loja/${store.slug}`,
        lastModified: store.created_at ? new Date(store.created_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
      });
    });

    // Busca todos os produtos do marketplace
    // 5000 é um limite seguro para o sitemap sem precisar paginar
    const products = await getAllPublicMarketplaceProducts(5000); 
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
