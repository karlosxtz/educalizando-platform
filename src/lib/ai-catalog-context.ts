type ContextProduct = { id: string; titulo?: string | null; descricao?: string | null; tags?: string[] | null; seasonal_tags?: string[] | null };
const normalize = (value: string) => value.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const stop = new Set(['como', 'para', 'qual', 'quais', 'esse', 'este', 'essa', 'esta', 'minha', 'meus', 'loja', 'produto', 'material', 'sobre', 'quero', 'pode', 'fazer', 'melhorar', 'hoje']);

/** Caller supplies only the authenticated store's catalog. Current question outweighs chat history. */
export function selectAiCatalogContext<T extends ContextProduct>(products: T[], question: string, history: string, focusId?: string, limit = 4): T[] {
  const terms = (text: string) => [...new Set(normalize(text).split(' ').filter(term => term.length > 3 && !stop.has(term)))];
  const current = terms(question), previous = terms(history.slice(-2400));
  return products.map((product, index) => {
    const title = normalize(`${product.titulo || ''} ${(product.tags || []).join(' ')} ${(product.seasonal_tags || []).join(' ')}`);
    const description = normalize(product.descricao || '');
    const score = (tokens: string[]) => tokens.reduce((total, term) => total + (title.includes(term) ? 5 : description.includes(term) ? 1 : 0), 0);
    return { product, index, priority: product.id === focusId ? 1 : 0, score: score(current) * 4 + score(previous) };
  }).sort((a, b) => b.priority - a.priority || b.score - a.score || a.index - b.index).slice(0, Math.max(1, Math.min(limit, 8))).map(item => item.product);
}
