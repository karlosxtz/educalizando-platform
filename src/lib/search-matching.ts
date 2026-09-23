import type { Category, Product } from './types';

const SEARCH_STOP_WORDS = new Set(['a', 'as', 'o', 'os', 'da', 'das', 'de', 'do', 'dos', 'e', 'em', 'na', 'nas', 'no', 'nos', 'para', 'por', 'com']);

/** Normaliza texto em português para que "árvore" e "arvore" encontrem o mesmo material. */
export function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function getSearchTerms(value: string) {
  const normalized = normalizeSearchText(value);
  return [...new Set(normalized.split(' ').filter((term) => term.length > 1 && !SEARCH_STOP_WORDS.has(term)))];
}

type SearchableProduct = Pick<Product, 'titulo' | 'descricao' | 'format_details' | 'seasonal_tags'> & {
  category?: Pick<Category, 'nome' | 'slug'> | null;
};

function productSearchText(product: SearchableProduct) {
  return normalizeSearchText([
    product.titulo,
    product.descricao,
    product.format_details,
    ...(product.seasonal_tags || []),
    product.category?.nome,
    product.category?.slug,
  ].filter(Boolean).join(' '));
}

/**
 * Não cria associações artificiais: só considera textos, formatos e tags que
 * já pertencem ao próprio produto. A pontuação prioriza a frase/todos os
 * termos antes de uma correspondência parcial útil.
 */
export function searchMatchScore(product: SearchableProduct, query: string) {
  const normalizedQuery = normalizeSearchText(query);
  const terms = getSearchTerms(query);
  const haystack = productSearchText(product);

  if (!normalizedQuery || !haystack) return 0;
  if (haystack.includes(normalizedQuery)) return 3;
  if (terms.length && terms.every((term) => haystack.includes(term))) return 2;
  if (terms.some((term) => haystack.includes(term))) return 1;
  return 0;
}
