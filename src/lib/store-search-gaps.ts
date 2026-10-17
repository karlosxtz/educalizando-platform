export type GapFilters = { category: string; education: string; collection: 'all' | 'new' | 'popular' | 'plr' };
export type SearchGapTerm = { term: string; count: number; catalog_count: number; filtered_count: number; last_seen: string };
export type SearchGapReport = { available: boolean; store: { nome_loja: string }; days: number; total: number; catalog_total: number; filtered_total: number; distinct_terms: number; terms: SearchGapTerm[] };
export function safeGapQuery(value: unknown): { query: string; normalized: string } | null {
  if (typeof value !== 'string') return null;
  const query = value.replace(/\s+/g, ' ').trim();
  if (query.length < 3 || query.length > 120 || /[@<>\u0000-\u001f]|https?:|www\.|(?:bearer|password|senha|token)\s*[:=]/i.test(query) || (query.match(/\d/g) || []).length >= 7) return null;
  const normalized = query.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  return normalized.length >= 3 && /[a-z]/.test(normalized) ? { query: query.toLocaleLowerCase('pt-BR'), normalized } : null;
}
/** Keep the same match rules as the store's visible search. */
export function matchesStoreSearch(product: { titulo: string; descricao?: string | null; tags?: string[] | null; seasonal_tags?: string[] | null }, query: string) {
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
  const term = normalize(query.trim());
  return !term || [product.titulo, product.descricao || '', ...(product.tags || []), ...(product.seasonal_tags || [])].some(value => normalize(value).includes(term));
}
export const gapKey = (storeId: string, normalized: string, filters: GapFilters) => JSON.stringify([storeId, normalized, filters.category, filters.education, filters.collection]);
export function gapSuggestion(term: SearchGapTerm) {
  return term.catalog_count > 0
    ? 'Confira se já existe um material adequado. Revise títulos e tags ou avalie produzir algo sobre esse tema.'
    : 'O termo encontrou materiais sem os filtros. Confira a classificação e os níveis de ensino antes de criar um novo produto.';
}
