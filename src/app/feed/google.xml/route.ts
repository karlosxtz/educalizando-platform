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
 * Feed XML para o Google Merchant Center: /feed/google.xml.
 * Somente produtos finais pagos entram na fonte. PLR e materiais grátis têm
 * regras próprias e não devem aparecer em anúncios ou listagens de compra.
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
    const link = `${SITE_URL}/produto/${product.slug || product.id}`;
    const image = absoluteUrl(product.capa_url!);
    const title = merchantText(product.titulo, 150);
    const description = merchantText(
      product.descricao || `Material didático digital: ${product.titulo}`,
      5000,
    );
    const brand = product.store?.nome_loja || 'Educalizando';
    const productType = product.category?.nome
      ? `Materiais didáticos digitais > ${product.category.nome}`
      : 'Materiais didáticos digitais';

    return `
    <item>
      <g:id>${escapeXml(product.id)}</g:id>
      <g:title>${escapeXml(title)}</g:title>
      <g:description>${escapeXml(description)}</g:description>
      <g:link>${escapeXml(link)}</g:link>
      <g:image_link>${escapeXml(image)}</g:image_link>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:price>${Number(product.preco).toFixed(2)} BRL</g:price>
      <g:brand>${escapeXml(brand)}</g:brand>
      <g:product_type>${escapeXml(productType)}</g:product_type>
      <g:identifier_exists>false</g:identifier_exists>
      <g:shipping>
        <g:country>BR</g:country>
        <g:service>Entrega digital imediata</g:service>
        <g:price>0 BRL</g:price>
        <g:min_handling_time>0</g:min_handling_time>
        <g:max_handling_time>0</g:max_handling_time>
        <g:min_transit_time>0</g:min_transit_time>
        <g:max_transit_time>0</g:max_transit_time>
      </g:shipping>
    </item>`;
  }).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Educalizando — Materiais Didáticos</title>
    <link>${SITE_URL}</link>
    <description>Materiais didáticos digitais publicados na Educalizando.</description>${xmlItems}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
