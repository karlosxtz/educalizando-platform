import { supabaseAdmin } from './supabase';

const STOP_WORDS = new Set(['a','o','as','os','de','da','do','das','dos','para','por','com','em','um','uma','atividade','material','quero','preciso','tem','ano']);
const SYNONYMS: Record<string, string[]> = {
  folclore: ['folclorico', 'lendas', 'lenda', 'cultura brasileira'], brasil: ['brasileiro', 'brasileira', 'cultura brasileira'],
  alfabetizacao: ['alfabeto', 'silabas', 'leitura', 'escrita'], primavera: ['estacoes', 'flores'], pascoa: ['coelho'],
};
export type WhatsAppCatalogProduct = { id: string; slug?: string | null; titulo: string; preco: number; descricao?: string | null };
export function normalizeCatalogQuery(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(term => term.length > 2 && !STOP_WORDS.has(term)).slice(0, 6);
}
export async function searchStoreCatalog(storeId: string, query: string): Promise<WhatsAppCatalogProduct[]> {
  const terms = normalizeCatalogQuery(query); if (!terms.length) return [];
  const variants = [...new Set(terms.flatMap(term => [term, ...(SYNONYMS[term] || [])]))].slice(0, 12);
  // `seasonal_tags` é um array do Postgres. Termos com espaço são ótimos para
  // título/descrição, mas não formam um elemento válido do array no filtro `cs`.
  const clauses = variants.flatMap(term => [
    `titulo.ilike.%${term}%`,
    `descricao.ilike.%${term}%`,
    ...(term.includes(' ') ? [] : [`seasonal_tags.cs.{${term}}`]),
  ]).join(',');
  const { data, error } = await supabaseAdmin.from('products').select('id,slug,titulo,preco,descricao').eq('store_id', storeId).eq('status', 'publicado').is('excluido_em', null).or(clauses).limit(12);
  if (error) { console.error('[WhatsApp Catalog Search]', error); return []; }
  const scored = (data || []).map(product => {
    const haystack = normalizeCatalogQuery(`${product.titulo} ${product.descricao || ''}`).join(' ');
    const score = variants.reduce((sum, term) => sum + (haystack.includes(term) ? 2 : 0), 0) + (haystack.includes(terms[0]) ? 3 : 0);
    return { ...product, preco: Number(product.preco || 0), score };
  });
  return scored.sort((a,b) => b.score - a.score).slice(0, 5).map(({ score, ...product }) => product);
}
export function formatCatalogSearchReply(query: string, products: WhatsAppCatalogProduct[], storeSlug?: string) {
  if (!products.length) return `Não encontrei “${query}” nesta loja. Tente outro tema, série ou categoria, ou escreva “catálogo” para ver os materiais disponíveis.`;
  const list = products.map((product, index) => {
    const price = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.preco);
    const path = storeSlug ? `\nhttps://www.educalizando.com.br/loja/${storeSlug}/produto/${product.slug || product.id}` : '';
    return `${index + 1}. ${product.titulo} — ${price}${path}`;
  }).join('\n\n');
  return `Encontrei estes materiais para “${query}”:\n\n${list}\n\nToque no link do material para ver os detalhes e comprar com segurança.`;
}
