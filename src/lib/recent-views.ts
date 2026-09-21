import { Product, Store } from './types';

const RECENT_VIEWS_KEY = '@educalizando:recent_views';
const RECENT_VIEWS_CHANGED_EVENT = 'educalizando:recent-views-changed';
const MAX_RECENT_VIEWS = 8;

export type RecentProduct = Product & { store?: Store };

const EMPTY_RECENT_PRODUCTS: RecentProduct[] = [];
let cachedSerializedViews: string | null | undefined;
let cachedRecentViews: RecentProduct[] = EMPTY_RECENT_PRODUCTS;

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
    window.dispatchEvent(new Event(RECENT_VIEWS_CHANGED_EVENT));
  } catch (error) {
    console.error('[recent-views] Failed to save recent view:', error);
  }
}

export function getRecentViews(): RecentProduct[] {
  if (typeof window === 'undefined') return EMPTY_RECENT_PRODUCTS;
  try {
    const existing = localStorage.getItem(RECENT_VIEWS_KEY);
    if (existing === cachedSerializedViews) return cachedRecentViews;

    cachedSerializedViews = existing;
    cachedRecentViews = existing ? JSON.parse(existing) : EMPTY_RECENT_PRODUCTS;
    return cachedRecentViews;
  } catch (error) {
    console.error('[recent-views] Failed to load recent views:', error);
    cachedSerializedViews = null;
    cachedRecentViews = EMPTY_RECENT_PRODUCTS;
    return cachedRecentViews;
  }
}

export function subscribeToRecentViews(onStoreChange: () => void) {
  if (typeof window === 'undefined') return () => {};

  const notify = () => onStoreChange();
  window.addEventListener('storage', notify);
  window.addEventListener(RECENT_VIEWS_CHANGED_EVENT, notify);

  return () => {
    window.removeEventListener('storage', notify);
    window.removeEventListener(RECENT_VIEWS_CHANGED_EVENT, notify);
  };
}
