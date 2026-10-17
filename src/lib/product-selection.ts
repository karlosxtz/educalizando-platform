import type { Product } from './types';

/** Display facts only; never infer a license's contents from the final version. */
export function productSelectionFacts(product: Product, plr = false) {
  if (plr && product.is_plr) return [{ label: 'Modalidade', value: 'Licença PLR — confira as condições na descrição desta versão' }];
  const colors = { colorido: 'Colorido', preto_e_branco: 'Preto e branco', colorido_e_preto_e_branco: 'Colorido e preto e branco' };
  const facts = [];
  if (product.format_details?.trim()) facts.push({ label: 'Formato e uso', value: product.format_details.trim() });
  else if (product.tipo) facts.push({ label: 'Tipo de material', value: product.tipo.toUpperCase() });
  if (Number.isInteger(product.page_count) && Number(product.page_count) > 0) facts.push({
    label: product.tipo === 'video' ? 'Quantidade informada' : 'Páginas',
    value: `${product.page_count} ${product.tipo === 'video' ? 'itens' : product.page_count === 1 ? 'página' : 'páginas'}`,
  });
  if (product.age_range?.trim()) facts.push({ label: 'Público indicado no cadastro', value: product.age_range.trim() });
  if (product.color_mode && colors[product.color_mode]) facts.push({ label: 'Modo de cor', value: colors[product.color_mode] });
  return facts;
}

/** Public preview links only. Paid delivery URLs are deliberately never read. */
export function productSampleLink(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    if (/^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(url.hostname)) return null;
    if (/\/(private-materials|private-plr|private-files)(\/|$)/i.test(url.pathname)) return null;
    if (Array.from(url.searchParams.keys()).some(key => /^(x-amz-|signature$|token$)/i.test(key))) return null;
    return url.href;
  } catch { return null; }
}
