import { normalizeSearchText } from './search-matching';
import type { Product } from './types';

type PublicCandidate = Product;
const words = (value: string) => ` ${normalizeSearchText(value)} `;
const contains = (text: string, expressions: string[]) => expressions.some(expression => text.includes(words(expression)));

/** Editorial selection only. Never reclassifies or updates a creator's product. */
export function intentProductScore(product: PublicCandidate, slug: string): number {
  if (product.status !== 'publicado' || product.excluido_em) return 0;
  const primary = words([product.titulo, ...(product.tags || [])].join(' '));
  const classification = words([product.category?.nome, product.category?.slug,
    product.education_level?.nome, product.education_level?.slug].filter(Boolean).join(' '));
  const detail = words([product.descricao, product.format_details].filter(Boolean).join(' ').replace(/<[^>]*>/g, ' '));
  if (slug === 'materiais-didaticos' || slug === 'recursos-pedagogicos') return 1;
  if (slug === 'atividades-para-imprimir') {
    if (product.tipo === 'pdf') return 3;
    return contains(`${primary} ${detail}`, ['para imprimir', 'imprimivel', 'imprimiveis']) ? 2 : 0;
  }
  const expressions: Record<string, string[]> = {
    'atividades-alfabetizacao': ['alfabetizacao', 'alfabetizar', 'letramento', 'alfabeto', 'silaba', 'silabas', 'vogais', 'consoantes', 'leitura e escrita'],
    'educacao-infantil': ['educacao infantil', 'pre escola', 'creche', 'maternal', 'bercario'],
    'atividades-ensino-fundamental': ['ensino fundamental', 'fundamental i', 'fundamental ii', 'anos iniciais', 'anos finais'],
    'jogos-pedagogicos': ['jogo', 'jogos', 'domino', 'bingo', 'jogo da memoria', 'trilha pedagogica'],
    'planos-de-aula-bncc': ['plano de aula', 'planos de aula', 'sequencia didatica', 'sequencias didaticas'],
  };
  const terms = expressions[slug];
  if (!terms) return 0;
  // Title/tags first, then declared category/level, then description. Whole words
  // avoid "jogo" matching "jogou" or one generic word in "ensino fundamental".
  if (contains(primary, terms)) return 4;
  if (contains(classification, terms)) return 3;
  return contains(detail, terms) ? 1 : 0;
}

export function selectIntentProducts<T extends PublicCandidate>(products: T[], slug: string, limit = 8): T[] {
  const seen = new Set<string>();
  return products.map(product => ({ product, score: intentProductScore(product, slug) }))
    .filter(({ product, score }) => {
      if (!score || seen.has(product.id)) return false;
      seen.add(product.id);
      return true;
    })
    .sort((a, b) => b.score - a.score || Number(b.product.views_count || 0) - Number(a.product.views_count || 0)
      || a.product.id.localeCompare(b.product.id))
    .slice(0, limit).map(({ product }) => product);
}
