import type { EducationLevel, Product } from './types';

/** The multi-selection is authoritative; the legacy primary field is only a fallback. */
export function productEducationLevels(product: Pick<Product, 'education_level_ids' | 'education_level_id' | 'education_level'>, levels: EducationLevel[]): EducationLevel[] {
  const ids = [...new Set(product.education_level_ids?.length ? product.education_level_ids : product.education_level_id ? [product.education_level_id] : [])];
  const byId = new Map(levels.map(level => [level.id, level]));
  if (product.education_level) byId.set(product.education_level.id, product.education_level);
  return ids.map(id => byId.get(id)).filter((level): level is EducationLevel => Boolean(level));
}
