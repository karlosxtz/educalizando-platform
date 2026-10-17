export type SeoStore = { id: string; slug: string; nome_loja: string };
export type SeoCategory = { id: string; slug: string; nome: string };
export type SeoCatalogProduct = { id: string; store_id: string; category_id?: string | null; category_ids?: string[] | null };

const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const CATEGORY_ALIASES: Record<string, string> = {
  'ciencia-e-biologia': 'ciencias-biologia',
  religioso: 'ensino-religioso',
  'outros-conteudos': 'outros',
};
const NEVER_INDEX = new Set(['outros', 'outrosconteudos', 'combo']);

// One typo, separator differences, or a generated four-character suffix. Never
// match broad shared words such as "professor" or "recursos pedagógicos" alone.
function nearSlug(a: string, b: string) {
  const x = normalize(a), y = normalize(b);
  if (x === y) return true;
  if (Math.min(x.length, y.length) < 8) return false;
  if (a.replace(/-[a-z0-9]{4}$/, '') === b || b.replace(/-[a-z0-9]{4}$/, '') === a) return true;
  if (Math.abs(x.length - y.length) > 1) return false;
  let i = 0, j = 0, differences = 0;
  while (i < x.length && j < y.length) {
    if (x[i] === y[j]) { i++; j++; continue; }
    if (++differences > 1) return false;
    if (x.length >= y.length) i++;
    if (y.length >= x.length) j++;
  }
  return differences + Number(i < x.length || j < y.length) <= 1;
}

/** Read-only decisions: no renaming, merging records, or changing visibility to buyers. */
export function buildSeoIndexPolicy<P extends SeoCatalogProduct>(products: P[], stores: SeoStore[], categories: SeoCategory[]) {
  const visibleIds = new Set(stores.filter(s => s.slug).map(s => s.id));
  const publicProducts = products.filter(p => visibleIds.has(p.store_id));
  const storeCounts = new Map(stores.map(s => [s.id, 0]));
  const categoryProducts = new Map<string, Set<string>>();
  const byId = new Map(categories.map(c => [c.id, c]));
  for (const product of publicProducts) {
    storeCounts.set(product.store_id, (storeCounts.get(product.store_id) || 0) + 1);
    for (const id of new Set([product.category_id, ...product.category_ids || []])) {
      const category = id && byId.get(id);
      if (!category) continue;
      if (!categoryProducts.has(category.slug)) categoryProducts.set(category.slug, new Set());
      categoryProducts.get(category.slug)!.add(product.id);
    }
  }
  const duplicateStores: { first: SeoStore; second: SeoStore; firstCount: number; secondCount: number; suppressedId: string | null; reason: string }[] = [];
  const suppressed = new Set<string>();
  for (let i = 0; i < stores.length; i++) for (let j = i + 1; j < stores.length; j++) {
    const first = stores[i], second = stores[j];
    const sameName = !!normalize(first.nome_loja || '') && normalize(first.nome_loja || '') === normalize(second.nome_loja || '');
    if (!sameName && !nearSlug(first.slug, second.slug)) continue;
    const firstCount = storeCounts.get(first.id) || 0, secondCount = storeCounts.get(second.id) || 0;
    // Equal counts require the owner's decision, rather than an arbitrary winner.
    const suppressedId = firstCount < secondCount ? first.id : secondCount < firstCount ? second.id : null;
    if (suppressedId) suppressed.add(suppressedId);
    duplicateStores.push({ first, second, firstCount, secondCount, suppressedId, reason: sameName ? 'nome normalizado igual' : 'slug quase igual' });
  }
  const storeRules = new Map(stores.map(s => [s.id, {
    count: storeCounts.get(s.id) || 0,
    indexable: (storeCounts.get(s.id) || 0) > 0 && !suppressed.has(s.id),
    reason: !storeCounts.get(s.id) ? 'sem produtos publicados' : suppressed.has(s.id) ? 'loja duplicada com menos produtos' : null,
  }]));
  const slugs = [...new Set(categories.map(c => c.slug).filter(Boolean))];
  const categoryRules = new Map(slugs.map(slug => {
    const canonicalSlug = CATEGORY_ALIASES[slug] && slugs.includes(CATEGORY_ALIASES[slug]) ? CATEGORY_ALIASES[slug] : slug;
    const members = slugs.filter(s => s === canonicalSlug || CATEGORY_ALIASES[s] === canonicalSlug);
    const group = categories.filter(c => members.includes(c.slug));
    const ids = new Set(members.flatMap(s => [...categoryProducts.get(s) || []]));
    const count = categoryProducts.get(slug)?.size || 0;
    const alwaysNoindex = NEVER_INDEX.has(normalize(slug)) || group.some(c => NEVER_INDEX.has(normalize(c.nome)));
    const indexable = count >= 3 && !alwaysNoindex;
    return [slug, { slug, canonicalSlug, count, combinedCount: ids.size, categoryIds: group.map(c => c.id),
      indexable, inSitemap: indexable && canonicalSlug === slug,
      reason: alwaysNoindex ? 'categoria genérica' : count < 3 ? 'menos de 3 produtos publicados' : canonicalSlug !== slug ? 'canonical consolidado' : null,
    }];
  }));
  return { publicProducts, storeRules, categoryRules, duplicateStores };
}
