import type { Product } from './types';

export function productCompleteness(product: Partial<Product>) {
  const checks = [
    { label: 'título', ok: Boolean(product.titulo?.trim()) },
    { label: 'descrição', ok: Boolean(product.descricao && product.descricao.trim().length >= 50) },
    { label: 'capa', ok: Boolean(product.capa_url) },
    { label: 'categoria', ok: Boolean(product.category_id || product.category_ids?.length) },
    { label: 'nível de ensino', ok: Boolean(product.education_level_id || product.education_level_ids?.length) },
    { label: 'preço', ok: product.is_free === true || Number(product.preco) > 0 },
    { label: 'arquivo de entrega', ok: Boolean(product.arquivo_url || product.delivery_files?.length || product.has_original_delivery) },
    { label: 'prévia', ok: Boolean(product.preview_url || (product.gallery_urls?.length || product.images?.length || 0) > 1) },
  ];
  return {
    score: Math.round((checks.filter(item => item.ok).length / checks.length) * 100),
    completeRequired: checks.slice(0, 7).every(item => item.ok),
    missing: checks.filter(item => !item.ok).map(item => item.label),
    previewRecommended: !checks[7].ok,
  };
}
