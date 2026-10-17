import { AI_FORMAT_ERROR } from './ai-json';

/** Map complete generated content into the editor contract without inventing text. */
export function normalizeSeoResponse(value: Record<string, unknown>, currentTitle: string): Record<string, unknown> {
  const nested = value.proposal ?? value.proposta ?? value.seo;
  const source = nested && typeof nested === 'object' && !Array.isArray(nested) ? nested as Record<string, unknown> : value;
  const texts = (items: unknown) => (Array.isArray(items) ? items : typeof items === 'string' ? [items] : [])
    .filter((item): item is string => typeof item === 'string' && Boolean(item.trim())).map(item => item.trim());
  const options = texts(source.descriptionOptions ?? source.descricoes);
  const description = texts(source.description ?? source.descricao)[0] || options[0];
  if (!description) throw new Error(AI_FORMAT_ERROR);
  const titles = texts(source.titles ?? source.title ?? source.titulos ?? source.titulo);
  if (!titles.length && !currentTitle.trim()) throw new Error(AI_FORMAT_ERROR);
  return { ...source, description, descriptionOptions: options,
    titles: titles.length ? titles : [currentTitle], tags: texts(source.tags),
    analysis: [...texts(source.analysis), ...(!titles.length ? ['A IA não sugeriu um título; o título atual foi preservado para revisão.'] : [])] };
}
