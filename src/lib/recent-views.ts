import { Product, Store } from './types';

const RECENT_VIEWS_KEY = '@educalizando:recent_views';
const MAX_RECENT_VIEWS = 8;

export type RecentProduct = Product & { store?: Store };

export function addRecentView(product: RecentProduct) {
  if (typeof window === 'undefined') return;
  try {
    const existing = localStorage.getItem(RECENT_VIEWS_KEY);
    let views: RecentProduct[] = existing ? JSON.parse(existing) : [];

    // Remover duplicatas
    views = views.filter((p) => p.id !== product.id);

    // Adicionar no início
    views.unshift(product);

    // Limitar tamanho
    if (views.length > MAX_RECENT_VIEWS) {
      views = views.slice(0, MAX_RECENT_VIEWS);
    }

    localStorage.setItem(RECENT_VIEWS_KEY, JSON.stringify(views));
  } catch (error) {
    console.error('[recent-views] Failed to save recent view:', error);
  }
}

export function getRecentViews(): RecentProduct[] {
  if (typeof window === 'undefined') return [];
  try {
    const existing = localStorage.getItem(RECENT_VIEWS_KEY);
    return existing ? JSON.parse(existing) : [];
  } catch (error) {
    console.error('[recent-views] Failed to load recent views:', error);
    return [];
  }
}
