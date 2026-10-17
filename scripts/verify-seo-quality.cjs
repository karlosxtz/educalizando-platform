const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(path, mocks = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  } }).outputText, { exports, require: name => mocks[name] || require(name), URL });
  return exports;
}
const { buildSeoIndexPolicy } = load('src/lib/seo-index-policy.ts');
const { CATEGORY_INTRODUCTIONS } = load('src/lib/category-editorial.ts');
const stores = [
  { id: 'a', slug: 'minha-loja', nome_loja: 'Minha Loja' },
  { id: 'b', slug: 'minha-loja-1234', nome_loja: 'Mínha loja!' },
  { id: 'empty', slug: 'loja-vazia', nome_loja: 'Vazia' },
  { id: 'distinct', slug: 'outra-loja', nome_loja: 'Outra Loja' },
];
const categories = [
  { id: 'c1', nome: 'Ciências & Biologia', slug: 'ciencias-biologia' },
  { id: 'c2', nome: 'Ciências & Biologia', slug: 'ciencias-biologia' },
  { id: 'alias', nome: 'Ciência e Biologia', slug: 'ciencia-e-biologia' },
  { id: 'thin', nome: 'Música', slug: 'musica' },
  ...['Outros', 'Outros Conteúdos', 'Combo'].map((nome, i) => ({ id: 'generic' + i, nome, slug: ['outros', 'outros-conteudos', 'combo'][i] })),
];
const product = (id, store_id, category_ids = []) => ({ id, store_id, category_ids, category_id: category_ids[0] });
const products = [product('p1', 'a', ['c1', 'c2']), product('p2', 'a', ['c2']), product('p3', 'a', ['c2']),
  product('p4', 'b', ['alias']), product('p5', 'distinct', ['thin']), product('hidden', 'invisible', ['thin']),
  ...Array.from({ length: 4 }, (_, i) => product('g' + i, 'a', ['generic0', 'generic1', 'generic2']))];
const policy = buildSeoIndexPolicy(products, stores, categories);
assert.equal(policy.storeRules.get('empty').indexable, false);
assert.equal(policy.storeRules.get('b').indexable, false);
assert.equal(policy.storeRules.get('a').indexable, true);
assert.equal(policy.duplicateStores.length, 1);
assert.equal(policy.duplicateStores[0].suppressedId, 'b');
assert.equal(policy.categoryRules.get('ciencias-biologia').count, 3, 'Same product counted once across duplicate IDs');
assert.equal(policy.categoryRules.get('ciencias-biologia').combinedCount, 4);
assert.equal(policy.categoryRules.get('ciencias-biologia').categoryIds.length, 3);
assert.equal(policy.categoryRules.get('ciencia-e-biologia').canonicalSlug, 'ciencias-biologia');
assert.equal(policy.categoryRules.get('ciencia-e-biologia').indexable, false);
assert.equal(policy.categoryRules.get('ciencia-e-biologia').inSitemap, false);
assert.equal(policy.categoryRules.get('musica').count, 1, 'Invisible storefront excluded');
for (const slug of ['outros', 'outros-conteudos', 'combo']) assert.equal(policy.categoryRules.get(slug).indexable, false);
const next = buildSeoIndexPolicy([...products, product('new', 'empty'), product('m2', 'distinct', ['thin']), product('m3', 'distinct', ['thin'])], stores, categories);
assert.equal(next.storeRules.get('empty').indexable, true, 'Publication restores store automatically');
assert.equal(next.categoryRules.get('musica').inSitemap, true, 'Third publication restores category');
assert.equal(buildSeoIndexPolicy(products.filter(p => p.store_id !== 'empty'), stores, categories).storeRules.get('empty').indexable, false);
const tie = buildSeoIndexPolicy([product('a1', 'a'), product('b1', 'b')], stores, []);
assert.equal(tie.duplicateStores[0].suppressedId, null, 'Ties require an owner decision');
assert.equal(tie.storeRules.get('a').indexable, true);
assert.equal(tie.storeRules.get('b').indexable, true);
assert.equal(Object.keys(CATEGORY_INTRODUCTIONS).length, 10);
const paragraphs = new Set();
for (const [slug, intro] of Object.entries(CATEGORY_INTRODUCTIONS)) {
  const words = intro.join(' ').split(/\s+/).length;
  assert(words >= 150, slug + ': ' + words + ' words');
  for (const text of intro) { assert(!paragraphs.has(text), 'No repeated editorial mold'); paragraphs.add(text); }
}
const seo = load('src/lib/seo.ts', { './public-image-url': load('src/lib/public-image-url.ts') });
const pages = load('src/lib/page-seo.ts', { './seo': seo });
const catalog = load('src/lib/catalog-seo.ts', { './seo': seo, './page-seo': pages });
const longName = 'Um material didático com um nome completo e muito detalhado que não pode ser mutilado durante a otimização';
const metadata = catalog.productMetadata({ id: 'real', slug: 'real', titulo: longName, descricao: 'Informação real.', status: 'publicado' });
assert.equal(metadata.title, longName);
assert.equal(metadata.description, 'Informação real.');
assert.equal(catalog.productMetadata({ id: 'real', slug: 'real', titulo: longName }).description, longName + '.');
assert(!metadata.title.includes('…') && !metadata.description.includes('…'));
assert.equal(metadata.openGraph.title, longName);
assert.equal(metadata.twitter.description, metadata.description);
assert.equal(catalog.productMetadata({ id: 'real', slug: 'real', titulo: longName }, false, stores[0]).alternates.canonical, metadata.alternates.canonical);
console.log('PASS qualidade SEO: limiares, publicação/despublicação, pares e empates, aliases, contagem única, 10 textos com 150+ palavras, nomes inteiros e canonical único.');

async function verifyFailedRead() {
  const db = { from() {
    const q = { select() { return q; }, in() { return q; }, is() { return q; }, neq() { return q; }, order() { return q; },
      range: async () => ({ data: null, error: new Error('database unavailable') }) };
    return q;
  } };
  const publicCatalog = load('src/lib/seo-public-catalog.ts', {
    'server-only': {}, react: { cache: fn => fn }, 'next/cache': { unstable_cache: fn => fn },
    './supabase': { supabase: db }, './sitemap-pagination': load('src/lib/sitemap-pagination.ts'),
    './seo-index-policy': { buildSeoIndexPolicy },
  });
  await assert.rejects(publicCatalog.readSeoPublicCatalog(), /database unavailable/);
  console.log('PASS catálogo: falha de banco não vira lista vazia nem noindex indevido.');
}
verifyFailedRead().catch(error => { console.error(error); process.exitCode = 1; });
