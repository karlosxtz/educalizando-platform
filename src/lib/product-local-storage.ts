import { Product } from './types';

export function getDeletedProductIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const saved = localStorage.getItem('educalizando_deleted_products_v1');
    if (saved) {
      const arr = JSON.parse(saved);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch (_e) {}
  return new Set();
}

export function addDeletedProductId(id: string) {
  if (typeof window === 'undefined' || !id) return;
  try {
    const clean = id.replace(/^prod_/i, '');
    const set = getDeletedProductIds();
    set.add(id);
    set.add(clean);
    set.add(`prod_${clean}`);
    localStorage.setItem('educalizando_deleted_products_v1', JSON.stringify(Array.from(set)));
  } catch (_e) {}
}

export function removeDeletedProductId(id: string) {
  if (typeof window === 'undefined' || !id) return;
  try {
    const clean = id.replace(/^prod_/i, '');
    const set = getDeletedProductIds();
    set.delete(id);
    set.delete(clean);
    set.delete(`prod_${clean}`);
    localStorage.setItem('educalizando_deleted_products_v1', JSON.stringify(Array.from(set)));
  } catch (_e) {}
}

export function getLocalProducts(): Product[] {
  if (typeof window === 'undefined') return [];
  const deletedIds = getDeletedProductIds();
  const saved = localStorage.getItem('educalizando_products_v3');
  if (!saved) return [];
  try {
    const prods: Product[] = JSON.parse(saved);
    return Array.isArray(prods) ? prods.filter(p => !deletedIds.has(p.id) && !deletedIds.has(p.id.replace(/^prod_/i, ''))) : [];
  } catch (_e) {
    return [];
  }
}

export function saveLocalProducts(products: Product[]) {
  if (typeof window !== 'undefined') {
    const deletedIds = getDeletedProductIds();
    const cleanList = products.filter(p => !deletedIds.has(p.id) && !deletedIds.has(p.id.replace(/^prod_/i, '')));
    localStorage.setItem('educalizando_products_v3', JSON.stringify(cleanList));
  }
}

// 4. Obter Produtos da Loja (Dashboard)
