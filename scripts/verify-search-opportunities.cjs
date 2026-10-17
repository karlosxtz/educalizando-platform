const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
function load(file, mocks = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText, { exports, require: name => mocks[name] || require(name), URL, URLSearchParams, Request, Response, console });
  return exports;
}
const seo = load('src/lib/seo.ts', { './public-image-url': load('src/lib/public-image-url.ts') });
const pages = load('src/lib/page-seo.ts', { './seo': seo });
const { productMetadata } = load('src/lib/catalog-seo.ts', { './seo': seo, './page-seo': pages });
const product = { id: 'test', slug: 'material', titulo: 'Nome longo de material que já aparece no título e não precisa ser repetido no resumo', tipo: 'pdf', page_count: 12, descricao: 'Modelos de carrinhos e bandeiras para recortar e montar. '.repeat(8) };
const snapshot = JSON.stringify(product);
const metadata = productMetadata(product);
assert(metadata.description.length <= 155);
assert.match(metadata.description, /^Modelos de carrinhos/);
assert.match(metadata.description, /PDF · 12 páginas\.$/);
assert.doesNotMatch(metadata.description, /\.\.\.|…|BNCC|especialista|gratuito/i);
assert.equal(metadata.title, product.titulo);
assert.equal(metadata.description, metadata.openGraph.description);
assert.equal(metadata.description, metadata.twitter.description);
assert.equal(JSON.stringify(product), snapshot, 'Metadata must not mutate records');
const plr = productMetadata({ ...product, is_plr: true, plr_descricao: 'Licença cadastrada de revenda.' }, true);
assert.equal(plr.description, 'Licença cadastrada de revenda.', 'Do not assume the final-version page count applies to PLR');
assert.equal(plr.alternates.canonical, metadata.alternates.canonical);
const duplicate = productMetadata(product, false, undefined, '12345678');
assert(duplicate.description.length <= 155);
assert.match(duplicate.description, /Ref\. 12345678\.$/);
assert.doesNotMatch(pages.pageMetadata('/atividades-para-imprimir').title, /grátis/i);

const link = { __esModule: true, default: ({ children, href }) => React.createElement('a', { href }, children) };
const Discovery = load('src/components/store/ProductDiscoveryLinks.tsx', { 'next/link': link }).default;
const props = { store: { slug: 'loja', nome_loja: 'Loja real' }, category: { id: 'cat', slug: 'historia', nome: 'História' }, levels: [{ id: 'level', slug: 'ensino-fundamental-2', nome: 'Ensino Fundamental II' }], products: [{ id: 'p2', slug: 'outro', titulo: 'Outro material' }] };
const html = renderToStaticMarkup(React.createElement(Discovery, props));
assert.match(html, /href="\/produto\/outro"/);
assert.match(html, /href="\/categorias\/historia"/);
assert.match(html, /href="\/atividades-por-ano\/ensino-fundamental-2"/);
assert(!html.includes('<h1'));
const storeHtml = renderToStaticMarkup(React.createElement(Discovery, { ...props, storefront: true, category: { ...props.category, store_id: 'store' } }));
assert.match(storeHtml, /href="\/loja\/loja\/produto\/outro"/);
assert.match(storeHtml, /href="\/loja\/loja\?category=cat"/);

const { readableProductDescription } = load('src/lib/product-description.ts');
assert.equal(readableProductDescription('<p>Primeiro parágrafo.</p><p>Segundo.</p>'), 'Primeiro parágrafo.\nSegundo.');
assert(!readableProductDescription('<script>segredo()</script><p>Real</p>').includes('segredo'));
const { CALENDAR_EDITORIAL } = load('src/lib/calendar-editorial.ts');
for (const entry of Object.values(CALENDAR_EDITORIAL)) {
  assert(entry.title.length <= 60 && entry.description.length <= 155);
  assert(entry.sections.map(s => s.text).join(' ').split(/\s+/).length >= 150);
  assert(!entry.sections.some(s => /alinhad[oa]s? à BNCC|desenvolvid[oa]s? por especialistas/i.test(s.text)));
}
console.log('PASS resumos úteis com fatos reais, PLR/canonical preservados, links SSR de descoberta e parágrafos legíveis.');
const { legacyProductRedirect, LEGACY_PRODUCT_URLS } = load('src/lib/legacy-product-urls.ts', { './seo': seo });
for (const [source, destination] of Object.entries(LEGACY_PRODUCT_URLS)) {
  const r = legacyProductRedirect(new Request(seo.SITE_URL + '/produto/' + source + '?licenca=plr&utm_source=teste'));
  assert.equal(r.status, 301);
  assert.equal(r.headers.get('Location'), seo.SITE_URL + '/produto/' + destination + '?licenca=plr&utm_source=teste');
  assert.equal(legacyProductRedirect(new Request(seo.SITE_URL + '/produto/' + source, { method: 'POST' })), null);
}
assert.equal(legacyProductRedirect(new Request(seo.SITE_URL + '/produto/inexistente')), null);
assert.equal(legacyProductRedirect(new Request(seo.SITE_URL + '/produto/constructor')), null);
assert.equal(legacyProductRedirect(new Request(seo.SITE_URL + '/produto/__proto__')), null);
assert.equal(legacyProductRedirect(new Request(seo.SITE_URL + '/api/checkout')), null);
console.log('PASS URLs antigas: 301 apenas em três correspondências confirmadas; query preservada, POST e checkout intactos.');
const brand = load('src/lib/brand-assets.ts');
const Header = load('src/components/MarketplaceHeader.tsx', {
  '@/lib/brand-assets': brand,
  '@/components/ui/CatalogImage': { __esModule: true, default: props => React.createElement('img', props) },
  '@/components/OnDemandLink': link,
  '@/components/store/CartContext': { useCart: () => ({ items: [], total: 0, toggleCart: () => {} }) },
  '@/lib/supabase': { supabase: {} },
  'next/navigation': { useSearchParams: () => { throw new Promise(() => {}); } },
  './CategoryDropdown': { __esModule: true, default: () => null },
  './SearchBar': { __esModule: true, default: () => React.createElement('input', { placeholder: 'Buscar material' }) },
}).default;
const header = renderToStaticMarkup(React.createElement(Header));
assert.match(header, /<header/);
assert.match(header, /Buscar material/);
assert.match(header, /Abrir carrinho/);
assert.match(header, /href="\/entrar"/);
assert(header.includes(brand.PUBLIC_BRAND_LOGO));
assert.doesNotMatch(header, /Carregando menu|logo-educalizando\.png/);
console.log('PASS cabeçalho completo no SSR mesmo com parâmetros suspensos; logo leve no MinIO.');
