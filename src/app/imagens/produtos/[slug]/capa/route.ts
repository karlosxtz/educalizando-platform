import { productCoverImageUrl } from '@/lib/seo';
import { readPublicProduct } from '@/lib/public-page-data';

/** Historical SEO URL: resolve public metadata and redirect, never proxy bytes. */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await readPublicProduct(slug);
  if (!product?.capa_url || product.excluido_em || !['publicado', 'ativo', 'published'].includes(product.status)) {
    return new Response(null, { status: 404 });
  }
  const target = productCoverImageUrl(product.slug || product.id, product.capa_url);
  const url = new URL(target);
  if (url.pathname.startsWith('/imagens/produtos/') || url.pathname.startsWith('/api/') || url.pathname.startsWith('/media/catalogo/')) {
    return new Response(null, { status: 404 });
  }
  return new Response(null, { status: 302, headers: { Location: target, 'Cache-Control': 'public, max-age=300' } });
}
