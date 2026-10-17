export const revalidate = 3600;

import { readPublicRelatedProducts } from '@/lib/public-page-data';
import { readPublicReviewSummary } from '@/lib/product-review-summary';
import { readSeoProductReference } from '@/lib/seo-identity';
import { isIndexableProduct, productMetadata, productStructuredData } from '@/lib/catalog-seo';
import StoreAnalytics from '@/components/store/StoreAnalytics';
import { getBnccSkillsByIds,getCategories,getEducationLevels } from '@/lib/category-service';
import { getPaidProductSalesCount } from '@/lib/product-social-proof';
import { serializeJsonLd } from '@/lib/seo';
import { readPublicProduct as getProductById, readPublicStoreProducts as getPublicProductsByStoreId, readPublicStore as getStoreBySlug } from '@/lib/public-page-data';
import type { Product } from '@/lib/types';
import { ChevronRight,Home,Store } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound,permanentRedirect } from 'next/navigation';
import { ReactNode } from 'react';
import ProductProgressiveView from '@/components/store/ProductProgressiveView';
import ProductPublicSummary from '@/components/store/ProductPublicSummary';
import ProductSelectionGuide from '@/components/store/ProductSelectionGuide';
import ProductDiscoveryLinks from '@/components/store/ProductDiscoveryLinks';
import { publicProductDetail, publicStoreProduct } from '@/lib/public-store-presentation';

interface ProductDetailPageProps {
  params: Promise<{
    slug: string;
    produtoSlug: string;
  }>;
  searchParams: Promise<{ licenca?: string | string[]; origem?: string | string[] }>;
}

export async function generateMetadata({ params, searchParams }: ProductDetailPageProps): Promise<Metadata> {
  const { produtoSlug, slug } = await params;
  const query = await searchParams;
  
  let product = await getProductById(produtoSlug);
  const store = await getStoreBySlug(slug);

  if (!product && store) {
    const storeProducts = await getPublicProductsByStoreId(store.id);
    const cleanId = produtoSlug.replace(/^prod_/i, '');
    product = storeProducts.find(p => p.id === produtoSlug || p.id === cleanId || p.id === `prod_${cleanId}` || p.slug === produtoSlug) || null;
  }
  
  if (!store || !isIndexableProduct(product)) {
    notFound();
  }

  if (product.store_id !== store.id && !(await getPublicProductsByStoreId(store.id)).some(item => item.id === product.id)) notFound();
  return productMetadata(product, query.licenca === 'plr', store, await readSeoProductReference(product, store));
}

export default async function ProductDetailPage({ params, searchParams }: ProductDetailPageProps) {
  const { slug, produtoSlug } = await params;
  const query = await searchParams;

  const store = await getStoreBySlug(slug);
  if (!store) {
    notFound();
  }

  let product = await getProductById(produtoSlug);
  if (!isIndexableProduct(product)) {
    const storeProducts = await getPublicProductsByStoreId(store.id);
    const cleanId = produtoSlug.replace(/^prod_/i, '');
    product = storeProducts.find(p => p.id === produtoSlug || p.id === cleanId || p.id === `prod_${cleanId}` || p.slug === produtoSlug) || null;
  }

  if (!isIndexableProduct(product)) {
    notFound();
  }

  if (product.store_id !== store.id && !(await getPublicProductsByStoreId(store.id)).some(item => item.id === product.id)) notFound();

  // Redirecionamento SEO (301) se a URL atual não for o slug oficial
  if (product.slug && produtoSlug !== product.slug) {
    const isPlrLink = query.licenca === 'plr' && product.is_plr;
    const fromPlrMarketplace = query.origem === 'mercado-plr';
    const preservedQuery = [isPlrLink ? 'licenca=plr' : '', fromPlrMarketplace ? 'origem=mercado-plr' : ''].filter(Boolean).join('&');
    permanentRedirect(`/loja/${store.slug || store.id}/produto/${product.slug}${preservedQuery ? `?${preservedQuery}` : ''}`);
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
  const selectedLevels = educationLevels.filter(e => (product.education_level_ids?.length ? product.education_level_ids : [product.education_level_id]).includes(e.id));
  const educationLevel = selectedLevels.length ? { ...selectedLevels[0], nome: selectedLevels.map(e => e.nome).join(' · ') } : null;

  const storeProducts = await readPublicRelatedProducts(store.id, product.id);
  const otherStoreProducts = storeProducts.filter((item) => item.id !== product.id);
  const productCategories = product.category_ids?.length ? product.category_ids : product.category_id ? [product.category_id] : [];
  const productLevels = product.education_level_ids?.length ? product.education_level_ids : product.education_level_id ? [product.education_level_id] : [];
  const isRelated = (item: Product) => {
    const itemCategories = item.category_ids?.length ? item.category_ids : item.category_id ? [item.category_id] : [];
    const itemLevels = item.education_level_ids?.length ? item.education_level_ids : item.education_level_id ? [item.education_level_id] : [];
    return itemCategories.some(id => productCategories.includes(id)) || itemLevels.some(id => productLevels.includes(id));
  };
  const relatedProducts = [
    ...otherStoreProducts.filter(isRelated),
    ...otherStoreProducts.filter((item) => !isRelated(item)),
  ].slice(0, 4);

  // Breadcrumb structure
  const breadcrumbItems: { label: string; href: string; icon?: ReactNode }[] = [
    { label: 'Início', href: '/', icon: <Home className="w-4 h-4" /> },
    { label: store.nome_loja, href: `/loja/${store.slug}`, icon: <Store className="w-4 h-4" /> }
  ];
  
  if (category) {
    breadcrumbItems.push({ label: category.nome, href: `/loja/${store.slug}?category=${category.id}` });
  } else if (educationLevel) {
    breadcrumbItems.push({ label: educationLevel.nome, href: `/loja/${store.slug}?level=${educationLevel.id}` });
  }
  
  breadcrumbItems.push({ label: product.titulo, href: `/loja/${store.slug}/produto/${product.slug || product.id}` });

  const reviewedProduct = { ...product, ...await readPublicReviewSummary(product.id) };
  const productJsonLd = productStructuredData(reviewedProduct, store, query.licenca === 'plr', category?.nome, true);

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
      
      {/* Visual Breadcrumb */}
      <div className="hidden sm:block bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex min-w-0 flex-wrap items-center gap-y-1 text-sm text-slate-500 overflow-hidden">
            {breadcrumbItems.map((item, index) => (
              <div key={index} className="flex min-w-0 items-center">
                {index > 0 && <ChevronRight className="w-4 h-4 mx-2 text-slate-400 flex-shrink-0" />}
                {item.icon ? (
                  <Link href={item.href} className="hover:text-blue-600 transition-colors flex items-center gap-1">
                    {item.icon}
                    <span className={index === 0 ? "sr-only" : ""}>{item.label}</span>
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

      <ProductProgressiveView 
        store={store} 
        product={publicProductDetail(reviewedProduct)}
        category={category} 
        educationLevel={educationLevel}
        context="store"
        relatedProducts={relatedProducts.map(publicStoreProduct)}
        bnccSkills={bnccSkills}
        storeCategories={categories.filter((item) => storeProducts.some((storeProduct) =>
          storeProduct.category_id === item.id || storeProduct.category_ids?.includes(item.id)
        ))}
      >
          <ProductPublicSummary product={reviewedProduct} store={store} plr={query.licenca === 'plr'} />
        </ProductProgressiveView>
      <ProductSelectionGuide product={reviewedProduct} store={store} plr={query.licenca === 'plr'} />
      <ProductDiscoveryLinks store={store} category={category} levels={selectedLevels} products={relatedProducts} storefront />
      <StoreAnalytics
        storeId={store.id}
        metaPixelId={store.meta_pixel_id}
        googleAnalyticsId={store.google_analytics_id}
        viewContent={{ productId: product.id, title: product.titulo, price: Number(product.preco || 0), currency: 'BRL' }}
      />
    </div>
  );
}
