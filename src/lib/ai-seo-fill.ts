import type { AiEditorialValues } from './ai-workspace';
import { MAX_PRODUCT_TAGS } from './product-tags';
export type SeoProposal = { titles?: string[]; description?: string; tags?: string[]; categoryId?: string; educationLevelId?: string; ageRange?: string; formatDetails?: string };
/** A proposal can fill editorial fields, not financial/delivery data or facts missing from the source. */
export function fillAiSeoProposal(current: AiEditorialValues, proposal: SeoProposal, target: 'product' | 'plr'): AiEditorialValues {
  const description = proposal.description?.trim() || current.description;
  if (target === 'plr') return { ...current, description };
  const title = proposal.titles?.find(text => text.trim().length >= 30 && text.trim().length <= 65) || proposal.titles?.find(text => text.trim()) || current.title;
  return { ...current, title, description, tags: proposal.tags?.length ? [...new Set(proposal.tags)].slice(0, MAX_PRODUCT_TAGS) : current.tags,
    categoryId: proposal.categoryId || current.categoryId, educationLevelId: proposal.educationLevelId || current.educationLevelId,
    ageRange: proposal.ageRange || current.ageRange, formatDetails: proposal.formatDetails || current.formatDetails };
}
