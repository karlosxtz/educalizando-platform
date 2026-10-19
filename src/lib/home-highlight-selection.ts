import type { Product } from './types';

/** Choose stores uniformly first, so a large catalogue does not buy more exposure. */
export function selectHomeHighlights(products: Product[], freeProducts: Product[], random = Math.random, previous: string[] = []) {
  const usedStores = new Set<string>();
  const usedIds = new Set<string>();
  function pick(pool: Product[]) {
    const eligible = pool.filter(product => product.capa_url && !usedIds.has(product.id));
    const diverse = eligible.filter(product => !usedStores.has(product.store_id));
    const candidates = diverse.length ? diverse : eligible;
    const fresh = candidates.filter(product => !previous.includes(product.id));
    const groups = new Map<string, Product[]>();
    for (const product of fresh.length ? fresh : candidates) {
      const key = product.store_id || product.id;
      groups.set(key, [...(groups.get(key) || []), product]);
    }
    const stores = [...groups.values()];
    const group = stores[Math.floor(random() * stores.length)];
    const product = group?.[Math.floor(random() * group.length)];
    if (product) { usedStores.add(product.store_id); usedIds.add(product.id); }
    return product;
  }
  const free = pick(freeProducts.filter(product => product.is_free || Number(product.preco) === 0));
  const offer = pick(products.filter(product => !product.is_free && Number(product.preco_original || 0) > Number(product.preco)));
  const hero = pick(products);
  return { hero, free, offer };
}
