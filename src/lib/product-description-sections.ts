import { readableProductDescription } from './product-description';

export const DESCRIPTION_FIELDS = [
  { key: 'intro', title: 'Sobre este material', hint: 'Apresente a proposta do material com suas próprias palavras.' },
  { key: 'includes', title: 'O que está incluído', hint: 'Liste os arquivos e atividades que o comprador realmente recebe.' },
  { key: 'usage', title: 'Como usar', hint: 'Explique uma forma de aplicar o recurso, sem prometer resultados.' },
  { key: 'audience', title: 'Público indicado', hint: 'Informe a turma ou o contexto para o qual você preparou o material.' },
  { key: 'format', title: 'Formato e impressão', hint: 'Explique formato, impressão, cores e edição somente quando confirmados.' },
  { key: 'license', title: 'Condições de uso', hint: 'Descreva a licença real desta versão. Não confunda produto final com PLR.' },
] as const;
export type DescriptionField = (typeof DESCRIPTION_FIELDS)[number]['key'];
export type DescriptionDraft = Record<DescriptionField, string>;
export const emptyDescriptionDraft = (): DescriptionDraft => ({ intro: '', includes: '', usage: '', audience: '', format: '', license: '' });
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/:$/, '');

/** Exact, standalone headings only; legacy prose is kept as an introduction. */
export function parseProductDescription(value: string): DescriptionDraft {
  const draft = emptyDescriptionDraft();
  let key: DescriptionField = 'intro';
  for (const line of readableProductDescription(value).split('\n')) {
    const field = DESCRIPTION_FIELDS.find(field => normalize(field.title) === normalize(line));
    if (field) key = field.key;
    else draft[key] += (draft[key] ? '\n' : '') + line;
  }
  for (const field of DESCRIPTION_FIELDS) draft[field.key] = draft[field.key].trim();
  return draft;
}
export function composeProductDescription(draft: DescriptionDraft): string {
  return DESCRIPTION_FIELDS.flatMap(field => draft[field.key].trim() ? [`${field.title}\n${draft[field.key].trim()}`] : []).join('\n\n');
}

export function productDescriptionSections(value: string) {
  const draft = parseProductDescription(value);
  return DESCRIPTION_FIELDS.filter(field => draft[field.key]).map(field => ({ title: field.title, text: draft[field.key] }));
}
