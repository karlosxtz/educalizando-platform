const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
function load(file, mocks = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText,
    { exports, require: name => mocks[name] ? { __esModule: true, ...mocks[name] } : require(name), URL, URLSearchParams, console });
  return exports;
}
const theme = load('src/lib/store-themes.ts');
assert.equal(theme.STORE_THEMES.length, 6);
for (const invalid of [undefined, null, 'netflix', 'pinterest', '<script>', 'not-a-theme']) assert.equal(theme.storeThemeId(invalid), 'default');
assert.equal(theme.storeThemeId('estudio'), 'estudio');
assert.equal(theme.storeThemeColors('aurora', '#fff').accent, '#ffffff');
assert.equal(theme.storeThemeColors('aurora', '#fff').foreground, '#111827');
assert.equal(theme.storeThemeColors('aurora', '#000').foreground, '#ffffff');
assert.equal(theme.storeThemeColors('noite', 'javascript:bad').accent, '#67e8f9');
const css = { default: new Proxy({}, { get: (_, key) => key }) };
const Link = ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children);
const Image = ({ thumbnail: _thumbnail, fetchPriority: _priority, ...props }) => React.createElement('img', props);
const description = load('src/lib/product-description.ts');
const store = { id: 'store-test', slug: 'loja-teste', nome_loja: 'Loja de teste', descricao: 'Cadastro usado somente no teste automatizado.', cor_primaria: '#2563eb', banner_url: null, logo_url: null };
const product = { id: 'product-test', titulo: 'Material de teste', slug: 'material-teste', preco: 12, tipo: 'pdf', descricao: 'Descrição de teste', capa_url: null, store_id: store.id, listing_mode: 'standard', created_at: '2026-10-18', review_count: 0 };
const additions = [];
const cardModule = load('src/components/store/themes/StorefrontProductCard.tsx', {
  '@/components/FavoriteProductButton': { default: () => null },
  '@/components/store/StoreVideoCover': { default: ({product}) => React.createElement('img', {src:product.capa_url,alt:product.titulo}) }, '@/components/OnDemandLink': { default: Link }, '@/components/ui/CatalogImage': { default: Image }, '@/components/store/ProductEducationBadges': { default: () => null },
  '@/components/store/CartContext': { useCart: () => ({ addToCart: item => additions.push(item) }) }, '@/lib/product-description': description, './StorefrontTheme.module.css': css,
});
assert.equal(cardModule.storefrontProductHref(store, { ...product, listing_mode: 'plr' }), '/loja/loja-teste/produto/material-teste?licenca=plr');
function walk(node, predicate) {
  if (!node || typeof node !== 'object') return null;
  if (predicate(node)) return node;
  for (const child of React.Children.toArray(node.props?.children)) { const found = walk(child, predicate); if (found) return found; }
  return null;
}
for (const plr of [false, true]) {
  const tree = cardModule.default({ store, product: { ...product, listing_mode: plr ? 'plr' : 'standard' }, categories: [], levels: [] });
  const add = walk(tree, node => node.type === 'button'); assert(add); add.props.onClick();
  assert.equal(additions.at(-1).storeId, store.id); assert.equal(additions.at(-1).productId, product.id); assert.equal(additions.at(-1).isPlr, plr); assert.equal(additions.at(-1).price, 12);
  assert(!Object.hasOwn(additions.at(-1), 'arquivo_url'));
}
const free = cardModule.default({ store, product: { ...product, preco: 0, is_free: true }, categories: [], levels: [] });
assert.equal(walk(free, node => node.type === 'button'), null);
const props = { store, products: [product], filteredProducts: [product], categories: [], educationLevels: [], kits: [], clubs: [], selectedCategory: 'all', selectedEducation: 'all', selectedCollection: 'all', searchFilter: '', setSearchFilter() {}, setSelectedCategory() {}, setSelectedEducation() {}, setSelectedCollection() {} };
const hero = load('src/components/store/themes/StorefrontHero.tsx', {
  '@/components/StoreFollowControl': { default: () => null },
  '@/components/store/StoreVideoCover': { default: ({product}) => React.createElement('img', {src:product.capa_url,alt:product.titulo}) }, '@/components/OnDemandLink': { default: Link }, '@/components/ui/CatalogImage': { default: Image }, '@/lib/social-links': { normalizeExternalUrl: () => null }, '@/lib/whatsapp': { getStoreWhatsAppUrl: () => '' }, './StorefrontTheme.module.css': css,
}).default;
const extras = load('src/components/store/themes/StorefrontExtras.tsx', { '@/components/store/StoreVideoCover': { default: ({product}) => React.createElement('img', {src:product.capa_url,alt:product.titulo}) }, '@/components/OnDemandLink': { default: Link }, '@/components/ui/CatalogImage': { default: Image }, '@/lib/product-description': description, './StorefrontProductCard': cardModule, './StorefrontTheme.module.css': css }).default;
const storefront = load('src/components/store/themes/StorefrontTheme.tsx', {
  '@/components/OnDemandLink': { default: Link }, '@/components/store/CartContext': { useCart: () => ({ itemCount: 0, setIsOpen() {} }) }, '@/lib/store-themes': theme,
  '@/components/store/StoreCatalogControls': { default: () => React.createElement('input', { 'aria-label': 'Buscar material' }) }, '@/components/store/StoreCatalogMoreButton': { default: () => null },
  './StorefrontHero': { default: hero }, './StorefrontProductCard': cardModule, './StorefrontExtras': { default: extras }, './StorefrontTheme.module.css': css,
}).default;
for (const choice of theme.STORE_THEMES.filter(item => item.id !== 'default')) {
  const html = renderToStaticMarkup(React.createElement(storefront, { ...props, theme: choice.id }));
  assert(html.includes('data-theme="' + choice.id + '"')); assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert(html.includes('/cliente/login?from=loja-teste')); assert(html.includes('Buscar material')); assert(html.includes('Adicionar Material de teste ao carrinho'));
  assert(!html.includes('avaliação')); // No invented ratings.
  const empty = renderToStaticMarkup(React.createElement(storefront, { ...props, filteredProducts: [], theme: choice.id }));
  assert(empty.includes('Nenhum material por aqui')); assert(empty.includes('Limpar filtros'));
}
console.log('PASS temas: 5 estilos novos, fallback do padrão, cores legíveis, H1 único, estados vazios, links PLR e carrinho com produto/loja/licença preservados.');
