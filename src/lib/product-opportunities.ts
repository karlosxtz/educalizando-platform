import type { Product } from './types';
import { calculateProductSeoScore } from './product-seo-score';
import { productSampleLink } from './product-selection';
import { productDescriptionSections } from './product-description-sections';

export function productOpportunities(product: Product) {
  const seo = calculateProductSeoScore(product);
  const gallery = new Set([product.capa_url, ...(product.gallery_urls || []), ...(product.images || []).map(image => image.url)].filter(Boolean));
  const actions = seo.issues.map(text => ({ text, kind: 'cadastro' as string }));
  if (!productSampleLink(product.preview_url) && gallery.size < 2) actions.push({ text: 'Confira a galeria: mantenha fotos internas ou uma amostra pública para o comprador avaliar. Algumas imagens podem não estar disponíveis neste relatório.', kind: 'apresentacao' });
  if (product.descricao && productDescriptionSections(product.descricao).length < 2) actions.push({ text: 'Confira se a descrição explica o conteúdo incluído e o uso. O editor por tópicos ajuda a organizar.', kind: 'apresentacao' });
  if (!product.format_details?.trim()) actions.push({ text: 'Explique o formato e as condições de impressão ou uso.', kind: 'apresentacao' });
  if (!product.age_range?.trim()) actions.push({ text: 'Informe a faixa ou o ano indicado, quando isso se aplicar ao material.', kind: 'apresentacao' });
  return { product, score: seo.score, actions, visits: product.views_count != null && Number.isFinite(Number(product.views_count)) ? Math.max(0, Number(product.views_count)) : null, priority: seo.issues.length * 3 + actions.filter(action => action.kind === 'apresentacao').length };
}
export function rankedProductOpportunities(products: Product[], storeId: string) {
  return products.filter(product => product.store_id === storeId && product.status === 'publicado' && !product.excluido_em).map(productOpportunities)
    .sort((a, b) => b.priority - a.priority || (b.visits ?? -1) - (a.visits ?? -1) || a.product.titulo.localeCompare(b.product.titulo, 'pt-BR'));
}
