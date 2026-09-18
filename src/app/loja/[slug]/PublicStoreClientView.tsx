'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Store, Product, StoreListingProduct, StoreCollection, Category, EducationLevel, Kit, StoreThemeProps } from '@/lib/types';
import { getCategories, getEducationLevels } from '@/lib/category-service';
import { getPublicKitsByStoreId } from '@/lib/kit-service';

// Import Themes
import ThemeDefault from './themes/ThemeDefault';

interface PublicStoreClientViewProps {
  store: Store;
  initialProducts: Product[];
}

export default function PublicStoreClientView({ store, initialProducts }: PublicStoreClientViewProps) {
  const searchParams = useSearchParams();
  // Products come correctly from the server (SSR) via initialProducts
  // We do NOT re-fetch them client-side because Supabase anon RLS blocks it
  const [products] = useState<StoreListingProduct[]>(() => initialProducts.flatMap((product) => {
    const standardOffer: StoreListingProduct = { ...product, listing_mode: 'standard' };
    const hasPlrOffer = product.is_plr === true && Number(product.preco_plr || 0) > 0 && product.has_plr_delivery === true;

    if (!hasPlrOffer) return [standardOffer];

    return [
      standardOffer,
      {
        ...product,
        // A oferta de PLR é visualmente independente, mas mantém o mesmo ID para entregar o arquivo certo.
        preco: Number(product.preco_plr),
        listing_mode: 'plr',
      }
    ];
  }));
  const [searchFilter, setSearchFilter] = useState('');
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [educationLevels, setEducationLevels] = useState<EducationLevel[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(() => searchParams.get('category') || 'all');
  const [selectedEducation, setSelectedEducation] = useState<string>('all');
  const [selectedCollection, setSelectedCollection] = useState<StoreCollection>('all');

  useEffect(() => {
    loadMetadata();
  }, [store.id]);

  useEffect(() => {
    setSelectedCategory(searchParams.get('category') || 'all');
  }, [searchParams]);

  const loadMetadata = async () => {
    // Only fetch metadata (categories, education levels, kits) client-side
    // Products are already loaded from the server
    const [cats, edLevels, storeKits] = await Promise.all([
      getCategories(store.id),
      getEducationLevels(),
      getPublicKitsByStoreId(store.id),
    ]);
    setCategories(cats);
    setEducationLevels(edLevels);
    if (storeKits) {
      setKits(storeKits);
    }
  };


  const filteredProducts = useMemo(() => {
    const productScore = (product: StoreListingProduct) =>
      Number(product.views_count || 0) + (Number(product.review_count || 0) * 10) + (Number(product.average_rating || 0) * 2);
    const byNewest = (a: StoreListingProduct, b: StoreListingProduct) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    const byPopularity = (a: StoreListingProduct, b: StoreListingProduct) => productScore(b) - productScore(a) || byNewest(a, b);
    const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
    const term = normalize(searchFilter.trim());

    const matchingFilters = products.filter((product) => {
      const matchSearch = !term || normalize(product.titulo).includes(term) ||
        (product.descricao && normalize(product.descricao).includes(term)) ||
        Boolean(product.seasonal_tags?.some((tag) => normalize(tag).includes(term)));
      const matchCategory = selectedCategory === 'all' || product.category_id === selectedCategory;
      const matchEducation = selectedEducation === 'all' || product.education_level_id === selectedEducation;
      return matchSearch && matchCategory && matchEducation;
    });

    // Produto final e licença PLR nunca ficam misturados na mesma coleção.
    const finalProducts = matchingFilters.filter((product) => product.listing_mode !== 'plr');
    const plrProducts = matchingFilters.filter((product) => product.listing_mode === 'plr');

    if (selectedCollection === 'popular') return [...finalProducts].sort(byPopularity).slice(0, 8);
    if (selectedCollection === 'new') return [...finalProducts].sort(byNewest).slice(0, 8);
    if (selectedCollection === 'plr') return [...plrProducts].sort(byPopularity);
    return finalProducts;
  }, [products, searchFilter, selectedCategory, selectedEducation, selectedCollection]);

  // A loja pública só oferece filtros que fazem sentido para o próprio catálogo.
  // O cadastro continua exibindo todas as opções disponíveis ao criador.
  const storeCategories = useMemo(() => {
    const categoryIds = new Set(products.map((product) => product.category_id).filter((id): id is string => Boolean(id)));
    return categories.filter((category) => categoryIds.has(category.id));
  }, [categories, products]);

  const storeEducationLevels = useMemo(() => {
    const educationIds = new Set(products.map((product) => product.education_level_id).filter((id): id is string => Boolean(id)));
    return educationLevels.filter((level) => educationIds.has(level.id));
  }, [educationLevels, products]);

  const themeProps: StoreThemeProps = {
    store,
    products,
    filteredProducts,
    categories: storeCategories,
    educationLevels: storeEducationLevels,
    kits,
    selectedCategory,
    setSelectedCategory,
    selectedEducation,
    setSelectedEducation,
    searchFilter,
    setSearchFilter,
    selectedCollection,
    setSelectedCollection
  };

  const theme = <ThemeDefault {...themeProps} />;

  const buttonStyle = store.button_style || 'rounded';
  return <div className={`store-button-style-${buttonStyle}`}>{theme}<style>{`.store-button-style-pill button,.store-button-style-pill a[class*="rounded"][class*="px-"]{border-radius:9999px!important}.store-button-style-square button,.store-button-style-square a[class*="rounded"][class*="px-"]{border-radius:.375rem!important}.store-button-style-rounded button,.store-button-style-rounded a[class*="rounded"][class*="px-"]{border-radius:.75rem!important}.store-button-style-soft button,.store-button-style-soft a[class*="rounded"][class*="px-"]{border-radius:1.25rem!important}.store-button-style-sharp button,.store-button-style-sharp a[class*="rounded"][class*="px-"]{border-radius:0!important}`}</style></div>;
}
