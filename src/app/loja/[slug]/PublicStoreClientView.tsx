'use client';

import { useState, useEffect } from 'react';
import { Store, Product, Category, EducationLevel, Kit, StoreThemeProps } from '@/lib/types';
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
  const [products] = useState<Product[]>(initialProducts);
  const [searchFilter, setSearchFilter] = useState('');
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [educationLevels, setEducationLevels] = useState<EducationLevel[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedEducation, setSelectedEducation] = useState<string>('all');

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
    return matchSearch && matchCategory && matchEducation;
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
    setSearchFilter
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
