import Footer from '@/components/Footer';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import { getBnccSkillsByIds,getCategories,getEducationLevels } from '@/lib/category-service';
import { getPaidProductSalesCount } from '@/lib/product-social-proof';
import { DEFAULT_SOCIAL_IMAGE,productCoverImageUrl,serializeJsonLd,SITE_URL } from '@/lib/seo';
import { getProductById,getPublicProductsByStoreId,getStoreById } from '@/lib/store-service';
import type { Product } from '@/lib/types';
import { shortSeoTitle, productSeoDescription } from '@/lib/page-seo';
import { ChevronRight,Home } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound,permanentRedirect } from 'next/navigation';
import ProductDetailClientView from '../../loja/[slug]/produto/[produtoSlug]/ProductDetailClientView';

interface GlobalProductDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    licenca?: string;
  }>;
}

// URLs antigas já rastreadas antes da padronização dos slugs. Manter este
// mapa evita páginas 404 e transfere a autoridade da URL antiga para a atual.
const LEGACY_PRODUCT_SLUGS: Record<string, string> = {
  'kit-das-caixinhas-da-alfabetizacao-yvy5': 'kit-das-caixinhas-da-alfabetizacao',
};

export async function generateMetadata({ params }: GlobalProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductById(LEGACY_PRODUCT_SLUGS[slug] || slug);
  
  if (!product) {
    return { title: 'Produto não encontrado | Educalizando' };
  }

  const title = shortSeoTitle(product.titulo);
  const description = productSeoDescription(product.titulo, product.descricao);
  const url = `${SITE_URL}/produto/${product.slug || product.id}`;
  const image = product.capa_url
    ? productCoverImageUrl(product.slug || product.id)
    : DEFAULT_SOCIAL_IMAGE;

  return {
    metadataBase: new URL(SITE_URL),
    keywords: [product.titulo, 'material didático digital', ...(product.tags || [])],
    title,
    description,
    robots: { index: true, follow: true },
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: 'Educalizando',
      locale: 'pt_BR',
      images: [{ url: image, alt: `Capa do material ${product.titulo}` }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function GlobalProductDetailPage({ params, searchParams }: GlobalProductDetailPageProps) {
  const { slug } = await params;
  const { licenca } = await searchParams;

  const legacySlug = LEGACY_PRODUCT_SLUGS[slug];
  if (legacySlug) {
    permanentRedirect(`/produto/${legacySlug}${licenca === 'plr' ? '?licenca=plr' : ''}`);
  }

  const product = await getProductById(slug);
  if (!product) {
    notFound();
  }

  // Redirecionamento SEO permanente se a URL atual não for o slug oficial (acesso via UUID).
  if (product.slug && slug !== product.slug) {
    permanentRedirect(`/produto/${product.slug}${licenca === 'plr' ? '?licenca=plr' : ''}`);
  }

  const store = await getStoreById(product.store_id);
  if (!store) {
    notFound();
  }

  if (product.order_bump_id) {
    const bump = await getProductById(product.order_bump_id);
    if (bump && !bump.excluido_em && bump.status === 'publicado') {
      product.order_bump_product = bump;
    }
  }

  const [categories, educationLevels, bnccSkills, salesCount] = await Promise.all([
    getCategories(store.id),
    getEducationLevels(),
    getBnccSkillsByIds(product.bncc_skill_ids || []),
    getPaidProductSalesCount(product.id)
  ]);
  product.sales_count = salesCount;

  const category = categories.find(c => c.id === product?.category_id) || null;
  const educationLevel = educationLevels.find(e => e.id === product?.education_level_id) || null;

  const storeProducts = await getPublicProductsByStoreId(store.id);
  const otherStoreProducts = storeProducts.filter((item) => item.id !== product.id);
  const productCategories = product.category_ids?.length ? product.category_ids : product.category_id ? [product.category_id] : [];
  const productLevels = product.education_level_ids?.length ? product.education_level_ids : product.education_level_id ? [product.education_level_id] : [];
  const isRelated = (item: Product) => {
    const itemCategories = item.category_ids?.length ? item.category_ids : item.category_id ? [item.category_id] : [];
    const itemLevels = item.education_level_ids?.length ? item.education_level_ids : item.education_level_id ? [item.education_level_id] : [];
    return itemCategories.some(id => productCategories.includes(id)) || itemLevels.some(id => productLevels.includes(id));
  };
  // Relevância primeiro: categoria e nível de ensino comuns. O restante da
  // própria loja completa a vitrine quando ainda não há itens suficientes.
  const relatedProducts = [
    ...otherStoreProducts.filter(isRelated),
    ...otherStoreProducts.filter((item) => !isRelated(item)),
  ].slice(0, 4);

  // Breadcrumb structure
  const breadcrumbItems = [
    { label: 'Início', href: '/' }
  ];
  
  if (category) {
    breadcrumbItems.push({ label: category.nome, href: `/categorias/${category.slug || category.id}` });
  } else if (educationLevel) {
    breadcrumbItems.push({ label: educationLevel.nome, href: `/atividades-por-ano/${educationLevel.slug || educationLevel.id}` });
  } else {
    breadcrumbItems.push({ label: 'Produtos', href: '/buscar' });
  }
  
  breadcrumbItems.push({ label: product.titulo, href: `/produto/${product.slug || product.id}` });

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.titulo,
    description: productSeoDescription(product.titulo, product.descricao),
    ...(product.capa_url ? {
      image: [productCoverImageUrl(product.slug || product.id)],
    } : {}),
    sku: product.id,
    brand: {
      '@type': 'Brand',
      name: 'Educalizando',
    },
    ...(category ? { category: category.nome } : {}),
    ...(product.format_details || product.color_mode || product.age_range || product.tags?.length ? {
      additionalProperty: [
        ...(product.format_details ? [{ '@type': 'PropertyValue', name: 'Formato', value: product.format_details }] : []),
        ...(product.color_mode ? [{ '@type': 'PropertyValue', name: 'Apresentação', value: product.color_mode === 'colorido_e_preto_e_branco' ? 'Material colorido e em preto e branco' : product.color_mode === 'colorido' ? 'Material colorido' : 'Material em preto e branco' }] : []),
        ...(product.age_range ? [{ '@type': 'PropertyValue', name: 'Faixa etária', value: product.age_range }] : []),
        ...(product.tags?.length ? [{ '@type': 'PropertyValue', name: 'Temas de busca', value: product.tags.join(', ') }] : []),
      ],
    } : {}),
    offers: {
      '@type': 'Offer',
      price: product.preco,
      priceCurrency: 'BRL',
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      url: `https://www.educalizando.com.br/produto/${product.slug || product.id}`,
    },
    ...(product.average_rating && product.review_count ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.average_rating,
        reviewCount: product.review_count,
      }
    } : {})
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: `https://www.educalizando.com.br${item.href}`
    }))
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />
      <MarketplaceHeader />
      
      {/* Visual Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex min-w-0 flex-wrap items-center gap-y-1 text-sm text-slate-500 overflow-hidden">
            {breadcrumbItems.map((item, index) => (
              <div key={index} className="flex min-w-0 items-center">
                {index > 0 && <ChevronRight className="w-4 h-4 mx-2 text-slate-400 flex-shrink-0" />}
                {index === 0 ? (
                  <Link href={item.href} className="hover:text-blue-600 transition-colors flex items-center gap-1">
                    <Home className="w-4 h-4" />
                    <span className="sr-only">{item.label}</span>
                  </Link>
                ) : index === breadcrumbItems.length - 1 ? (
                  <span className="min-w-0 max-w-[52vw] break-words font-medium text-slate-900 line-clamp-2 sm:max-w-[400px]">
                    {item.label}
                  </span>
                ) : (
                  <Link href={item.href} className="max-w-[28vw] truncate hover:text-blue-600 transition-colors sm:max-w-none">
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>

      <div className="flex-1">
        <ProductDetailClientView
          store={store}
          product={product}
          category={category}
          educationLevel={educationLevel}
          context="marketplace"
          relatedProducts={relatedProducts}
          bnccSkills={bnccSkills}
        />
      </div>
      <Footer />
    </div>
  );
}
