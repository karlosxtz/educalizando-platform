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
  } }).outputText, { exports, require: name => mocks[name] || require(name), URL, console });
  return exports;
}
const selection = load('src/lib/product-selection.ts');
const description = load('src/lib/product-description.ts');
const link = { __esModule: true, default: ({ children, href }) => React.createElement('a', { href }, children) };
const Guide = load('src/components/store/ProductSelectionGuide.tsx', {
  'next/link': link, '@/lib/product-selection': selection, '@/lib/product-description': description,
}).default;
const product = { id: 'real', titulo: 'Material real', tipo: 'pdf', page_count: 1, age_range: '8 anos',
  format_details: 'PDF para impressão', color_mode: 'preto_e_branco', preview_url: 'https://arquivos.educalizando.com.br/public-images/amostra.pdf',
  arquivo_url: 'https://private.test/secret.pdf', is_plr: true };
const store = { slug: 'loja-real', nome_loja: 'Loja real', author_bio: '<p>Professora de História.</p><script>segredo()</script>' };
const before = JSON.stringify({ product, store });
const html = renderToStaticMarkup(React.createElement(Guide, { product, store }));
assert.match(html, /1 página</);
assert.match(html, /8 anos/);
assert.match(html, /Preto e branco/);
assert.match(html, /PDF para impressão/);
assert.match(html, /Professora de História/);
assert.match(html, /href="\/loja\/loja-real"/);
assert.match(html, /href="https:\/\/arquivos.educalizando.com.br\/public-images\/amostra.pdf"/);
assert(!html.includes('secret.pdf') && !html.includes('segredo()') && !html.includes('<h1'));
assert.equal(before, JSON.stringify({ product, store }), 'Rendering must not mutate creator records');
const plr = renderToStaticMarkup(React.createElement(Guide, { product, store, plr: true }));
assert.match(plr, /Licença PLR/);
assert.doesNotMatch(plr, /1 página|8 anos|PDF para impressão|amostra.pdf/);
const missing = renderToStaticMarkup(React.createElement(Guide, { product: { titulo: 'Sem detalhes' }, store: { slug: 'loja', nome_loja: 'Loja' } }));
assert.doesNotMatch(missing, /página<|BNCC|especialista|Professora|Conferir a prévia/);
for (const invalid of ['javascript:alert(1)', 'http://localhost/file', 'https://localhost/file', 'https://user:password@example.test/file',
  'https://arquivos.educalizando.com.br/private-materials/file.pdf', 'https://s3.test/file?X-Amz-Signature=secret']) {
  assert.equal(selection.productSampleLink(invalid), null, `Unsafe preview: ${invalid}`);
}
assert.equal(selection.productSelectionFacts({ tipo: 'pdf', page_count: -2 }).length, 1);
assert.equal(selection.productSelectionFacts({ tipo: 'pdf', page_count: 1.5 }).length, 1);
assert(selection.productSelectionFacts({ tipo: 'video', page_count: 4 }).some(fact => fact.value === '4 itens'));

const CategoryGuide = load('src/components/seo/CategorySelectionGuide.tsx', { 'next/link': link }).default;
const categorized = [{ education_level: { id: 'level', slug: 'fundamental', nome: 'Fundamental' }, seasonal_tags: ['Natal', 'Natal'] }];
const category = renderToStaticMarkup(React.createElement(CategoryGuide, { name: 'História', products: categorized }));
assert.match(category, /Como escolher materiais de História/);
assert.match(category, /href="\/atividades-por-ano\/fundamental"/);
assert.equal((category.match(/href="\/buscar\?data=Natal"/g) || []).length, 1);
assert(!category.includes('<h1'));
assert.equal(renderToStaticMarkup(React.createElement(CategoryGuide, { name: 'Vazia', products: [] })), '');

// Mount the carousel's effects with controlled browser APIs: no timer offscreen,
// reduced motion, hidden tab advancement, focus/manual pause and observer cleanup.
function carouselEffectTest({ intersect = true, reduced = false, hidden = false, paused = false, focus = false }) {
  const effects = [], cleanups = [], stateValues = [0, focus, paused, intersect, reduced];
  let stateIndex = 0, timerCallback, cleared = false, disconnected = false, observed = false, nextIndex;
  const mocks = {
    react: { ...React, useState: () => { const index = stateIndex++; return [stateValues[index], value => { if (index === 0) nextIndex = typeof value === 'function' ? value(0) : value; }]; },
      useRef: () => ({ current: {} }), useEffect: effect => effects.push(effect) },
    'next/link': link, '@/components/ui/CatalogImage': { __esModule: true, default: props => React.createElement('img', { src: props.src, alt: props.alt }) },
    '@/lib/catalog-image-url': { catalogImageUrl: value => value },
  };
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/MainBannersCarousel.tsx', 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText, { exports, require: name => mocks[name] || require(name),
    window: { matchMedia: () => ({ matches: reduced, addEventListener() {}, removeEventListener() {} }) }, document: { hidden },
    IntersectionObserver: class { observe() { observed = true; } disconnect() { disconnected = true; } },
    setInterval: callback => { timerCallback = callback; return 1; }, clearInterval: () => { cleared = true; },
  });
  const result = exports.default({ banners: [{ id: 'a', title: 'Primeiro', image_desktop_url: 'https://minio.test/a.webp' }, { id: 'b', title: 'Segundo' }] });
  effects.forEach(effect => { const cleanup = effect(); if (cleanup) cleanups.push(cleanup); });
  if (timerCallback) timerCallback();
  cleanups.forEach(cleanup => cleanup());
  assert(observed && disconnected, 'Visibility observer must clean up');
  return { result, timer: !!timerCallback, nextIndex, cleared };
}
for (const options of [{ intersect: false }, { reduced: true }, { paused: true }, { focus: true }]) assert.equal(carouselEffectTest(options).timer, false);
assert.equal(carouselEffectTest({ hidden: true }).nextIndex, undefined);
const active = carouselEffectTest({});
assert(active.timer && active.cleared && active.nextIndex === 1);
assert.match(renderToStaticMarkup(active.result), /Pausar banners/);
console.log('PASS seleção com fatos reais e prévias seguras, PLR isolado, categorias sem queries adicionais e carrossel sem animação pesada/timers fora da tela.');
