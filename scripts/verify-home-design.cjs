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
const selection = load('src/lib/home-highlight-selection.ts', {});
const banners = load('src/components/HomeDiscoveryBanners.tsx', { 'next/link': link, '@/components/CatalogCover': cover });
const highlights = { __esModule:true, default: ({products,freeProducts}) => { const chosen=selection.selectHomeHighlights(products,freeProducts,()=>0);return React.createElement(React.Fragment,null,React.createElement(brand.HomeIntroduction,{products:chosen.hero?[chosen.hero]:[]}),React.createElement(banners.default,{freeProduct:chosen.free,offer:chosen.offer})); } };
const marketplace = load('src/components/HomepageMarketplace.tsx', {
  '@/components/HomeRotatingHighlights': highlights,
  'next/link': link, '@/components/HomeBrandContent': brand,
  '@/components/HomeDiscoveryBanners': load('src/components/HomeDiscoveryBanners.tsx', { 'next/link': link, '@/components/CatalogCover': cover }),
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
const sample=(id,store_id,extra={})=>({id,store_id,titulo:id,capa_url:'https://example.test/image.webp',preco:7,...extra});
const catalogue=[sample('a','store-a'),sample('b','store-b'),sample('sale','store-c',{preco_original:10})];
const olderFree=sample('older-free','store-d',{is_free:true,preco:0});
const chosen=selection.selectHomeHighlights(catalogue,[olderFree],()=>0);
assert.equal(chosen.free.id,'older-free');assert.equal(chosen.offer.id,'sale');assert.equal(new Set([chosen.hero.store_id,chosen.free.store_id,chosen.offer.store_id]).size,3);
const allFree=renderToStaticMarkup(React.createElement(marketplace,{...props,freeProducts:[olderFree,sample('free-two','store-e',{is_free:true,preco:0})]}));
assert.match(allFree,/older-free/);assert.match(allFree,/free-two/);
const weighted=[...Array.from({length:99},(_,i)=>sample('large-'+i,'large')),sample('small','small')];
assert.equal(selection.selectHomeHighlights(weighted,[],()=>0.75).hero.store_id,'small','Draw stores before products, not weighted by catalogue size');
assert.notEqual(selection.selectHomeHighlights(catalogue,[],()=>0,['a']).hero.id,'a','Avoid previous highlight if alternatives exist');
assert(Object.values(selection.selectHomeHighlights([],[],()=>0)).every(value=>value===undefined));
console.log('PASS home: one H1, real product links, unique store navigation, factual FAQ and usable empty state.');
