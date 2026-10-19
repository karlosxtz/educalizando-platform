const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
function load(path, mocks) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText, { exports, require: name => mocks[name] || require(name) });
  return exports;
}
const link = { __esModule: true, default: ({ href, children, prefetch: _prefetch, ...props }) => React.createElement('a', { href, ...props }, children) };
const cover = { __esModule: true, default: ({ title }) => React.createElement('img', { alt: title }) };
const faq = { HOME_FAQ: [{ question: 'Como acessar?', answer: 'Após a confirmação do pagamento.' }] };
const brand = load('src/components/HomeBrandContent.tsx', { 'next/link': link, '@/components/CatalogCover': cover, '@/lib/home-content': faq });
const blank = { __esModule: true, default: () => null };
const marketplace = load('src/components/HomepageMarketplace.tsx', {
  'next/link': link, '@/components/HomeBrandContent': brand,
  '@/components/ui/CatalogImage': blank, '@/components/MainBannersCarousel': blank,
  '@/components/MarketplaceKitCard': blank, '@/components/RecentlyViewed': blank,
  '@/components/UpcomingCalendarDates': blank,
  '@/components/ProductCard': { __esModule: true, default: ({ product }) => React.createElement('article', null, product.titulo) },
}).default;
const products = [{ id: 'real', slug: 'material-real', titulo: 'Material real', capa_url: 'https://arquivos.educalizando.com.br/public-images/real.webp', preco: 7 }];
const props = { products, stores: [{ id: 's', slug: 'loja-real', nome_loja: 'Loja real' }], kits: [], banners: [], monthlyTags: ['Natal'] };
const original = JSON.stringify(props);
const html = renderToStaticMarkup(React.createElement(marketplace, props));
assert.equal((html.match(/<h1\b/g) || []).length, 1, 'A public page needs one clear main heading');
assert.match(html, /href="\/produto\/material-real"/);
assert.equal((html.match(/href="\/loja\/loja-real"/g) || []).length, 1, 'Store links must not be duplicated for animation');
assert.match(html, /href="\/materiais-gratis"/);
assert.match(html, /href="\/calendario"/);
assert.equal(original, JSON.stringify(props), 'Presentation must not change creator records');
const empty = renderToStaticMarkup(React.createElement(marketplace, { ...props, products: [], stores: [] }));
assert.equal((empty.match(/<h1\b/g) || []).length, 1);
assert.match(empty, /Explorar catálogo/);
assert.doesNotMatch(empty, /undefined|NaN|\/produto\//);
const renderedFaq = renderToStaticMarkup(React.createElement(brand.HomeFaq));
assert.match(renderedFaq, /Como acessar\?/);
assert.match(renderedFaq, /Após a confirmação do pagamento\./);
console.log('PASS home: one H1, real product links, unique store navigation, factual FAQ and usable empty state.');

