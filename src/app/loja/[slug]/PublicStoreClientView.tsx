'use client';

import { useState, useEffect } from 'react';
import { Store, Product, StoreListingProduct, StoreCollection, Category, EducationLevel, Kit, StoreThemeProps } from '@/lib/types';
import { getCategories, getEducationLevels } from '@/lib/category-service';
import { getPublicKitsByStoreId } from '@/lib/kit-service';

// Import Themes
import ThemeDefault from './themes/ThemeDefault';
import ThemeMinimalist from './themes/ThemeMinimalist';
import ThemeNetflix from './themes/ThemeNetflix';
import ThemeLinkTree from './themes/ThemeLinkTree';
import ThemePinterest from './themes/ThemePinterest';

interface PublicStoreClientViewProps {
  store: Store;
  initialProducts: Product[];
}

export default function PublicStoreClientView({ store, initialProducts }: PublicStoreClientViewProps) {
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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedEducation, setSelectedEducation] = useState<string>('all');
  const [selectedCollection, setSelectedCollection] = useState<StoreCollection>('all');

  useEffect(() => {
    loadMetadata();
  }, [store.id]);

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


  const filteredProducts = products.filter(p => {
    const matchSearch = p.titulo.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (p.descricao && p.descricao.toLowerCase().includes(searchFilter.toLowerCase()));
    const matchCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
    const matchEducation = selectedEducation === 'all' || p.education_level_id === selectedEducation;
    const matchCollection = selectedCollection !== 'plr' || p.listing_mode === 'plr';
    return matchSearch && matchCategory && matchEducation && matchCollection;
  }).sort((a, b) => {
    if (selectedCollection === 'popular') {
      const score = (product: StoreListingProduct) => Number(product.views_count || 0) + (Number(product.review_count || 0) * 10) + (Number(product.average_rating || 0) * 2);
      return score(b) - score(a) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    if (selectedCollection === 'new') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    return 0;
  });

  const themeProps: StoreThemeProps = {
    store,
    products,
    filteredProducts,
    categories,
    educationLevels,
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

  const layout = store.layout_theme || 'default';

  switch (layout) {
    case 'minimalist':
      return <ThemeMinimalist {...themeProps} />;
    case 'netflix':
      return <ThemeNetflix {...themeProps} />;
    case 'linktree':
      return <ThemeLinkTree {...themeProps} />;
    case 'pinterest':
      return <ThemePinterest {...themeProps} />;
    case 'default':
    default:
      return <ThemeDefault {...themeProps} />;
  }
}
