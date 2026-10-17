import 'server-only';
import { supabase } from './supabase';
import { getPublicProductsByStoreId } from './product-read-service';

export const PUBLIC_DOCUMENT_PATH = /^\/(?:produto\/[^/]+|loja\/[^/]+(?:\/produto\/[^/]+)?|blog\/[^/]+)\/?$/;

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Resolve existence before SSR streams headers. Only public, read-only queries run here. */
export async function publicDocumentStatus(pathname: string): Promise<200 | 404 | 503> {
  try {
    const parts = pathname.split('/').filter(Boolean).map(decodeURIComponent);
    const storeSlug = parts[0] === 'loja' ? parts[1] : null;
    if (parts[0] === 'blog') {
      const { data, error } = await supabase.from('blog_posts').select('id')
        .eq('slug', parts[1]).eq('status', 'published').lte('published_at', new Date().toISOString()).maybeSingle();
      return error ? 503 : data ? 200 : 404;
    }
    const storeResult = storeSlug ? await supabase.from('stores').select('id').eq('slug', storeSlug).maybeSingle() : null;
    if (storeResult?.error) return 503;
    if (storeSlug && !storeResult?.data) return 404;
    const productSlug = storeSlug ? parts[3] : parts[1];
    if (!productSlug) return 200;
    // The historical alias is already redirected in next.config before SSR.
    const slug = productSlug === 'kit-das-caixinhas-da-alfabetizacao-yvy5' ? 'kit-das-caixinhas-da-alfabetizacao' : productSlug;
    const cleanId = slug.replace(/^prod_/i, '');
    const { data: product, error } = await supabase.from('products').select('id,store_id')
      .eq(uuid.test(cleanId) ? 'id' : 'slug', uuid.test(cleanId) ? cleanId : slug)
      .in('status', ['publicado', 'ativo', 'published']).is('excluido_em', null).maybeSingle();
    if (error) return 503;
    if (!product) return 404;
    if (storeResult?.data && product.store_id !== storeResult.data.id) {
      // Preserve the storefront's existing approved-affiliate visibility rules.
      return (await getPublicProductsByStoreId(storeResult.data.id)).some(item => item.id === product.id) ? 200 : 404;
    }
    if (!storeSlug) {
      const owner = await supabase.from('stores').select('id').eq('id', product.store_id).maybeSingle();
      if (owner.error) return 503;
      if (!owner.data) return 404;
    }
    return 200;
  } catch { return 503; }
}

export function publicDocumentError(status: 404 | 503, head = false) {
  const title = status === 404 ? 'Página não encontrada' : 'Página temporariamente indisponível';
  const text = status === 404 ? 'Este material ou loja não está disponível.' : 'Não foi possível carregar esta página agora. Tente novamente em instantes.';
  return new Response(head ? null : `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${title} | Educalizando</title></head><body><main><h1>${title}</h1><p>${text}</p><a href="/">Voltar à Educalizando</a></main></body></html>`, {
    status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow', ...(status === 503 ? { 'Retry-After': '60' } : {}) },
  });
}
