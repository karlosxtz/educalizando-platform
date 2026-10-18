import { SITE_URL } from './seo';
import { readableProductDescription } from './product-description';
import { directPublicImageUrl } from './public-image-url';

export const PINTEREST_SCOPES = ['boards:read', 'pins:write', 'user_accounts:read'];
export type PinterestBoard = { id: string; name: string; privacy: string };
export type PinterestJob = { id: string; product_id: string | null; title: string; status: 'queued' | 'processing' | 'published' | 'failed' | 'uncertain' | 'cancelled'; pin_id: string | null; error_message: string | null; created_at: string };
export type PinterestSnapshot = {
  configured: boolean; sandbox: boolean; migrationRequired: boolean;
  account: { username: string; board_id: string | null; board_name: string | null; auto_publish: boolean } | null;
  jobs: PinterestJob[];
};
export const pinterestId = (value: unknown): value is string => typeof value === 'string' && /^\d{1,30}$/.test(value);
export const pinterestUuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export function pinterestText(value: string, limit: number) {
  const clean = readableProductDescription(value).replace(/\s+/g, ' ').trim();
  return clean.length <= limit ? clean : clean.slice(0, limit).replace(/\s+\S*$/, '').trim();
}
/** Public cover only. Never resolve or sign a material delivery URL. */
export function pinterestImage(value: string | null) {
  if (!value) return null;
  const direct = directPublicImageUrl(value);
  try {
    const url = new URL(direct || value);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) return null;
    if (url.hostname !== 'arquivos.educalizando.com.br' || !url.pathname.startsWith('/public-images/uploads/')) return null;
    if (!/\.(jpe?g|png|webp)$/i.test(url.pathname) || /%2e|%2f|%5c/i.test(url.pathname)) return null;
    return url.href;
  } catch { return null; }
}
export function pinterestPin(product: { id: string; slug?: string | null; titulo: string; descricao?: string | null; capa_url: string | null }, store: { slug: string; nome_loja: string }, boardId: string, campaign = false) {
  const image = pinterestImage(product.capa_url);
  if (!image) throw new Error('Use uma capa JPG, PNG ou WebP pública da loja para publicar este material.');
  const title = pinterestText(product.titulo, 100);
  if (!title) throw new Error('O produto precisa de um título.');
  const link = new URL(`${SITE_URL}/loja/${encodeURIComponent(store.slug)}/produto/${encodeURIComponent(product.slug || product.id)}`);
  if (campaign) { link.searchParams.set('utm_source', 'pinterest'); link.searchParams.set('utm_medium', 'organic'); link.searchParams.set('utm_campaign', 'materiais'); }
  return { board_id: boardId, title, description: pinterestText([product.descricao || '', `Conheça o material na loja ${store.nome_loja}.`].join(' '), 800), alt_text: pinterestText(product.titulo, 500), link: link.href, media_source: { source_type: 'image_url', url: image, is_standard: true } };
}
