const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function load(path, mocks = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText, { exports, require: name => mocks[name] || require(name), URL });
  return exports;
}
const matching = load('src/lib/search-matching.ts');
const selection = load('src/lib/intent-product-selection.ts', { './search-matching': matching });
const { INTENT_EDITORIAL: editorial } = load('src/lib/intent-editorial.ts');
const seo = load('src/lib/seo.ts', { './public-image-url': { directPublicImageUrl: value => value } });
const { seoLandings, intentLandingMetadata } = load('src/lib/seo-landings.ts', {
  './intent-editorial': { INTENT_EDITORIAL: editorial }, '@/lib/seo': seo,
});
const product = (id, title, extra = {}) => ({ id, titulo: title, status: 'publicado', descricao: '', tipo: 'pdf', views_count: 1, ...extra });
const candidates = [
  product('unrelated', 'Painel de Natal', { descricao: 'Um recurso de ensino com atividades.', views_count: 1000000 }),
  product('letters', 'Alfabeto móvel para alfabetização'),
  product('description', 'Prática de escrita', { descricao: 'Proposta de alfabetização para a turma.', views_count: 100000 }),
  product('secondary', 'Caderno de atividades', { tags: ['sílabas'] }),
  product('draft', 'Alfabeto', { status: 'rascunho' }),
  product('deleted', 'Alfabeto', { excluido_em: '2026-01-01' }),
  product('partial', 'Ensino religioso'),
  product('fundamental', 'História', { education_level: { nome: 'Ensino Fundamental II' } }),
  product('infantil', 'Rotina da turma', { education_level: { nome: 'Educação Infantil' } }),
  product('game', 'Dominó de números'),
  product('false-game', 'Ele jogou e aprendeu'),
  product('lesson', 'Sequências didáticas sobre água'),
  product('video', 'Curso de desenho', { tipo: 'video' }),
];
const ids = slug => Array.from(selection.selectIntentProducts(candidates, slug), p => p.id);
assert.deepEqual(ids('atividades-alfabetizacao'), ['letters', 'secondary', 'description']);
assert.deepEqual(ids('atividades-ensino-fundamental'), ['fundamental'], 'Generic ensino must not match Fundamental');
assert.deepEqual(ids('educacao-infantil'), ['infantil']);
assert.deepEqual(ids('jogos-pedagogicos'), ['game'], 'Whole word, accented synonym, no jogou match');
assert.deepEqual(ids('planos-de-aula-bncc'), ['lesson'], 'Recognize sequence without claiming BNCC certification');
assert(!ids('atividades-para-imprimir').includes('video'));
assert.equal(selection.selectIntentProducts([candidates[1], candidates[1]], 'atividades-alfabetizacao').length, 1);
assert.equal(selection.selectIntentProducts(candidates, 'unknown').length, 0);
assert.equal(selection.selectIntentProducts(Array.from({ length: 20 }, (_, i) => product(String(i), 'Alfabeto')), 'atividades-alfabetizacao').length, 8);

const titles = new Set();
const descriptions = new Set();
for (const [slug, landing] of Object.entries(seoLandings)) {
  assert(editorial[slug], `Editorial missing for ${slug}`);
  const metadata = intentLandingMetadata(landing);
  assert(metadata.title.absolute.length <= 60, slug);
  assert(!metadata.title.absolute.includes('…'), slug);
  assert(!titles.has(metadata.title.absolute), `Duplicate title ${slug}`);
  titles.add(metadata.title.absolute);
  assert(metadata.description.length <= 155, slug);
  assert(!descriptions.has(metadata.description), `Duplicate description ${slug}`);
  descriptions.add(metadata.description);
  assert.equal(metadata.alternates.canonical, `https://www.educalizando.com.br/${slug}`);
  assert.equal(metadata.openGraph.title, metadata.title.absolute);
  assert(editorial[slug].sections.every(section => section.text.split(/\s+/).length > 50));
  for (const { href } of editorial[slug].related) {
    assert.notEqual(href, `/${slug}`);
    assert(fs.existsSync(`src/app${href}/page.tsx`) || href.startsWith('/atividades-por-ano/'));
  }
}

async function check() {
  let fail = false;
  let projection = '';
  const calls = [];
  const query = {
    select(value) { projection = value; return query; },
    eq(...args) { calls.push(args); return query; },
    is(...args) { calls.push(args); return query; },
    order() { return query; },
    async limit(size) { assert.equal(size, 500); return fail ? { error: new Error('offline') } : { data: candidates }; },
  };
  const catalog = load('src/lib/intent-catalog.ts', {
    'server-only': {}, react: { cache: fn => fn },
    'next/cache': { unstable_cache(fn, keys, options) { assert.equal(options.revalidate, 3600); assert(options.tags.includes('public-catalog')); return fn; } },
    './supabase': { supabase: { from: table => { assert.equal(table, 'products'); return query; } } },
    './intent-product-selection': selection,
  });
  const selected = await catalog.readIntentProducts('atividades-alfabetizacao');
  assert.equal(selected.length, 3);
  assert(!projection.includes('*') && !projection.includes('arquivo_url') && !projection.includes('delivery_files'));
  assert(calls.some(args => args[0] === 'status' && args[1] === 'publicado'));
  assert(calls.some(args => args[0] === 'excluido_em' && args[1] === null));
  fail = true;
  await assert.rejects(catalog.readIntentProducts('atividades-alfabetizacao'), /offline/);

  const emptyComponent = () => null;
  const { default: Page } = load('src/components/seo/IntentLandingPage.tsx', {
    '@/components/Footer': { default: emptyComponent }, '@/components/MarketplaceHeader': { default: emptyComponent },
    '@/components/ProductCard': { default: ({ product }) => React.createElement('a', { href: `/produto/${product.id}` }, product.titulo) },
    '@/lib/intent-editorial': { INTENT_EDITORIAL: editorial },
    '@/lib/intent-catalog': { readIntentProducts: async () => selected },
    '@/lib/seo': seo,
    'next/link': { default: ({ children, prefetch, ...props }) => React.createElement('a', props, children) },
    'lucide-react': Object.fromEntries(['ArrowRight', 'CheckCircle2', 'FileText', 'Lightbulb', 'Search'].map(name => [name, emptyComponent])),
  });
  const html = renderToStaticMarkup(await Page({ landing: seoLandings['atividades-alfabetizacao'] }));
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1);
  assert(html.includes('Observe o que a criança já sabe'));
  assert(html.includes('aria-label="Conteúdos relacionados"'));
  assert(!html.includes('Painel de Natal'));
  const graph = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1])['@graph'];
  const list = graph.find(item => item['@type'] === 'ItemList');
  assert.equal(list.numberOfItems, 3);
  for (const item of list.itemListElement) assert(html.includes(`href="/produto/${item.url.split('/').pop()}"`));
  assert.equal(graph.find(item => item['@type'] === 'FAQPage').mainEntity.length, 2);
  console.log('PASS seleção temática, publicação/exclusão, relevância antes de popularidade, metadados únicos, cache público sem arquivos privados, falha de banco, HTML e JSON-LD coerentes.');
}
check().catch(error => { console.error(error); process.exitCode = 1; });
