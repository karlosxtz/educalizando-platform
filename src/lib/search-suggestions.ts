import { INITIAL_GLOBAL_CATEGORIES } from './category-service';
import { SCHOOL_CALENDAR_TAGS } from './school-calendar';
import { normalizeSearchText } from './search-matching';
export type SearchSuggestion = { label: string; href: string; kind: 'Material' | 'Categoria' | 'Tema' };
export function discoverySuggestions(query: string): SearchSuggestion[] {
  const words = normalizeSearchText(query).split(' ').filter(Boolean);
  if (words.join('').length < 2) return [];
  const matches = (text: string) => words.every(word => normalizeSearchText(text).includes(word));
  return [
    ...INITIAL_GLOBAL_CATEGORIES.filter(category => matches(category.nome)).slice(0, 2).map(category => ({ label: category.nome, href: `/buscar?categoria=${encodeURIComponent(category.slug)}`, kind: 'Categoria' as const })),
    ...SCHOOL_CALENDAR_TAGS.filter(matches).slice(0, 2).map(tag => ({ label: tag, href: `/buscar?data=${encodeURIComponent(tag)}`, kind: 'Tema' as const })),
  ];
}
