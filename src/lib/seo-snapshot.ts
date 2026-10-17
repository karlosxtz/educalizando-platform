import { calculateProductSeoScore, type SeoScorableProduct } from './product-seo-score';
/** Analytics retain sales metrics; SEO always comes from the current saved product. */
export function reconcileSeoScores<T extends { id: string; title: string; coverUrl: string | null; score: number; suggestions: string[] }>(rows: T[], products: Array<SeoScorableProduct & { id: string }>): T[] {
  const current = new Map(products.map(product => [product.id, product]));
  return rows.filter(row => current.has(row.id)).map(row => {
    const product = current.get(row.id)!;
    const seo = calculateProductSeoScore(product);
    return { ...row, title: product.titulo || row.title, coverUrl: product.capa_url || null, score: seo.score, suggestions: seo.issues };
  });
}
