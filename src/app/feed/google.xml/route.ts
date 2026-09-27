import { getAllPublicMarketplaceProducts } from '@/lib/store-service';

const SITE_URL = 'https://www.educalizando.com.br';

function escapeXml(value: string | number) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function absoluteUrl(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  return `${SITE_URL}${value.startsWith('/') ? value : `/${value}`}`;
}

/**
 * A vitrine usa emojis para conversar com educadores. O Merchant Center exige
 * texto editorial sem caracteres chamativos. Esta limpeza existe apenas no
 * feed e nunca altera os dados nem a apresentação do produto na plataforma.
 */
function merchantText(value: string, maxLength: number) {
  return value
    .replace(/[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

/**
 * Feed para o Google Merchant Center. A URL pode ser cadastrada como uma
 * fonte programada no Merchant Center: /feed/google.xml.
 *
 * Mantemos apenas a oferta final do material. Licenças PLR possuem regra de
 * entrega e preço próprios, portanto não podem ser misturadas com o catálogo
 * comprado por alunos e educadores.
 */
export async function GET() {
  const products = await getAllPublicMarketplaceProducts(5000);
  const items = products.filter((product) =>
    !product.is_free &&
    Number(product.preco) > 0 &&
    Boolean(product.capa_url) &&
    Boolean(product.slug || product.id),
  );

  const xmlItems = items.map((product) => {
    const id = product.id;
    const link = `${SITE_URL}/produto/${product.slug || product.id}`;
    const image = absoluteUrl(product.capa_url!);
    product.titulo = merchantText(product.titulo, 150);
    const description = merchantText(
      product.descricao || `Material didático digital: ${product.titulo}`,
      5000,
    );
    const brand = product.store?.nome_loja || 'Educalizando';
    const productType = product.category?.nome
      ? `Materiais didáticos digitais > ${product.category.nome}`
      : 'Materiais didáticos digitais';

    return `\n    <item>\n      <g:id>${escapeXml(id)}</g:id>\n      <g:title>${escapeXml(product.titulo.slice(0, 150))}</g:title>\n      <g:description>${escapeXml(description)}</g:description>\n      <g:link>${escapeXml(link)}</g:link>\n      <g:image_link>${escapeXml(image)}</g:image_link>\n      <g:availability>in_stock</g:availability>\n      <g:condition>new</g:condition>\n      <g:price>${Number(product.preco).toFixed(2)} BRL</g:price>\n      <g:brand>${escapeXml(brand)}</g:brand>\n      <g:product_type>${escapeXml(productType)}</g:product_type>\n      <g:identifier_exists>false</g:identifier_exists>\n    </item>`;
  }).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n  <channel>\n    <title>Educalizando — Materiais Didáticos</title>\n    <link>${SITE_URL}</link>\n    <description>Materiais didáticos digitais publicados na Educalizando.</description>${xmlItems}\n  </channel>\n</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
