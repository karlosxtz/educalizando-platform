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
  } }).outputText, { exports, require: name => name === 'server-only' ? {} : mocks[name] || require(name), URL, Request, Response, console });
  return exports;
}
const seo = load('src/lib/seo.ts', { './public-image-url': load('src/lib/public-image-url.ts') });
const pages = load('src/lib/page-seo.ts', { './seo': seo });
const catalog = load('src/lib/catalog-seo.ts', { './seo': seo, './page-seo': pages });
const canonical = load('src/lib/canonical-host.ts', { './seo': seo });
const home = load('src/lib/home-content.ts');
const link = { __esModule: true, default: ({ children, ...props }) => React.createElement('a', props, children) };
const brand = load('src/components/HomeBrandContent.tsx', { '@/lib/home-content': home, 'next/link': link });

async function main() {
  const homeMeta = pages.pageMetadata('/');
  assert.match(homeMeta.title, /^Educalizando/);
  for (const path of Object.keys(pages.PAGE_SEO)) {
    const metadata = pages.pageMetadata(path);
    assert(metadata.title.length <= 60);
    assert(metadata.description.length <= 155);
    assert.equal(new URL(metadata.alternates.canonical).origin, seo.SITE_URL);
    assert.equal(metadata.openGraph.title, metadata.title);
    assert.equal(metadata.twitter.description, metadata.description);
  }
  for (const host of ['educalizando.com.br', 'site.vercel.app', 'site.workers.dev', 'site.pages.dev']) {
    const result = canonical.canonicalHostRedirect(new Request('https://' + host + '/loja/exemplo?ref=real'));
    assert.equal(result.status, 301);
    assert.equal(result.headers.get('Location'), seo.SITE_URL + '/loja/exemplo?ref=real');
  }
  for (const host of ['www.educalizando.com.br', '127.0.0.1:3001', 'arquivos.educalizando.com.br']) {
    assert.equal(canonical.canonicalHostRedirect(new Request('https://' + host + '/')), null);
  }
  assert.equal(canonical.canonicalHostRedirect(new Request('https://site.workers.dev/api/webhooks/asaas', { method: 'POST' })), null);
  const html = renderToStaticMarkup(React.createElement(React.Fragment, null,
    React.createElement(brand.HomeIntroduction), React.createElement(brand.HomeFaq)));
  assert.equal((html.match(/<h1/g) || []).length, 1);
  assert.equal((html.match(/educaizando/g) || []).length, 1);
  for (const item of home.HOME_FAQ) assert(html.includes(item.question));
  assert.match(html, /href="\/lojas"/);
  assert(!fs.readFileSync('src/components/StoreCard.tsx', 'utf8').includes('5.0'));

  const stores = [{ id: 'store', nome_loja: 'Exemplo', slug: 'exemplo' }];
  const products = Array.from({ length: 1001 }, (_, i) => ({ id: String(i).padStart(5, '0'), store_id: 'store', slug: 'material-' + i, status: 'publicado', excluido_em: null }));
  products.push({ id: 'draft', store_id: 'store', slug: 'rascunho', status: 'rascunho', excluido_em: null });
  products.push({ id: 'deleted', store_id: 'store', slug: 'excluido', status: 'publicado', excluido_em: '2026-01-01' });
  products.push({ id: 'orphan', store_id: 'hidden', slug: 'loja-oculta', status: 'publicado', excluido_em: null });
  let reviewFailure = false;
  const approved = Array.from({ length: 1001 }, (_, i) => ({ id: i, product_id: 'real', status: 'aprovado', nota: i < 1000 ? 4 : 5 }));
  const tables = { stores, products, reviews: [...approved, { id: 2001, product_id: 'real', status: 'oculto', nota: 1 }] };
  let failedTable = null;
  const db = { from(table) {
    let data = [...tables[table] || []];
    const q = {
      select() { return this; }, order() { return this; },
      eq(k, v) { data = data.filter(row => row[k] === v); return this; },
      neq(k, v) { data = data.filter(row => row[k] !== v); return this; },
      is(k, v) { data = data.filter(row => (row[k] ?? null) === v); return this; },
      in(k, values) { data = data.filter(row => values.includes(row[k])); return this; },
      gte(k, v) { data = data.filter(row => row[k] >= v); return this; },
      lte(k, v) { data = data.filter(row => row[k] <= v); return this; },
      range(from, to) { return Promise.resolve({ data: data.slice(from, to + 1), error: table === 'reviews' && reviewFailure ? new Error('unavailable') : null }); },
      maybeSingle() { return Promise.resolve({ data: data[0] || null, error: table === failedTable ? new Error('unavailable') : null }); },
    }; return q;
  } };
  const pagination = load('src/lib/sitemap-pagination.ts');
  const policy = load('src/lib/seo-index-policy.ts');
  const publicCatalog = load('src/lib/seo-public-catalog.ts', { './supabase': { supabase: db }, './sitemap-pagination': pagination, './seo-index-policy': policy, react: { cache: fn => fn }, 'next/cache': { unstable_cache: fn => fn } });
  const sitemapLib = load('src/lib/catalog-sitemap.ts', { '@/lib/seo': seo, '@/lib/supabase': { supabase: db }, '@/lib/sitemap-pagination': pagination, '@/lib/seo-public-catalog': publicCatalog });
  const sitemap = load('src/app/sitemap.ts', {
    '@/lib/catalog-sitemap': sitemapLib, '@/lib/seo': seo,
    '@/lib/glossary': { glossaryTerms: [] }, '@/lib/seo-landings': { seoLandings: {} }, '@/lib/school-calendar': { SCHOOL_CALENDAR_EVENTS: [] },
  });
  const entries = await sitemap.default();
  assert(entries.some(row => row.url.endsWith('/produto/material-1000')), 'Pagination must exceed the Supabase default 1000 rows');
  assert(!entries.some(row => row.url.includes('/loja/exemplo/produto/')));
  assert.equal(entries.filter(row => /rascunho|excluido|loja-oculta/.test(row.url)).length, 0);
  assert.equal(new Set(entries.map(row => row.url)).size, entries.length);
  const reviews = load('src/lib/product-review-summary.ts', { './supabase': { supabase: db }, react: { cache: fn => fn } });
  const stats = await reviews.readPublicReviewSummary('real');
  assert.equal(stats.review_count, 1001);
  assert.equal(stats.average_rating, 4);
  const product = { id: 'real', titulo: 'Material cadastrado', slug: 'material', status: 'publicado', preco: 12, ...stats };
  assert.equal(catalog.productStructuredData(product, { nome_loja: 'Exemplo', slug: 'exemplo' }).aggregateRating.reviewCount, 1001);
  reviewFailure = true;
  const absent = await reviews.readPublicReviewSummary('real');
  assert.equal(catalog.productStructuredData({ ...product, ...absent }, { nome_loja: 'Exemplo', slug: 'exemplo' }).aggregateRating, undefined);
  const storeMeta = catalog.productMetadata(product, false, { nome_loja: 'Exemplo', slug: 'exemplo' });
  assert.equal(storeMeta.alternates.canonical, seo.SITE_URL + '/produto/material');
  assert.equal(storeMeta.title, catalog.productMetadata(product).title);
  assert.equal(storeMeta.description, catalog.productMetadata(product).description);
  let candidates = [];
  const identityDb = { from() { const q = { select() { return this; }, in() { return this; }, is() { return this; }, eq() { return this; }, neq() { return this; }, ilike() { return this; }, limit: async () => ({ data: candidates, error: null }) }; return q; } };
  const identity = load('src/lib/seo-identity.ts', { './supabase': { supabase: identityDb }, './page-seo': pages });
  assert.equal(await identity.readSeoProductReference(product), undefined);
  candidates = [{ id: 'other', titulo: product.titulo }];
  assert.equal(await identity.readSeoProductReference(product), product.id.slice(0, 8));
  const first = catalog.productMetadata({ ...product, id: '11112222-a' }, false, undefined, '11112222');
  const second = catalog.productMetadata({ ...product, id: '33334444-b' }, false, undefined, '33334444');
  assert.notEqual(first.title, second.title);
  assert.notEqual(first.description, second.description);
  assert(first.title.length <= 60 && first.description.length <= 155);
  const long = { ...product, titulo: 'Texto cadastrado muito longo '.repeat(15) };
  assert.equal(catalog.productMetadata(long).description, catalog.productMetadata(long, false, { nome_loja: 'Exemplo', slug: 'exemplo' }).description);
  assert.equal(await identity.readSeoStoreHandle({ id: 'store', nome_loja: 'Exemplo', slug: 'exemplo' }), 'exemplo');
  const status = load('src/lib/public-document-status.ts', { './supabase': { supabase: db }, './product-read-service': { getPublicProductsByStoreId: async () => [] } });
  assert.equal(await status.publicDocumentStatus('/produto/material-0'), 200);
  assert.equal(await status.publicDocumentStatus('/produto/rascunho'), 404);
  assert.equal(await status.publicDocumentStatus('/produto/excluido'), 404);
  assert.equal(await status.publicDocumentStatus('/produto/inexistente'), 404);
  assert.equal(await status.publicDocumentStatus('/loja/inexistente'), 404);
  assert.equal(await status.publicDocumentStatus('/loja/exemplo/produto/material-0'), 200);
  failedTable = 'products';
  assert.equal(await status.publicDocumentStatus('/produto/material-0'), 503, 'Database outage must not become a 404');
  assert.equal(status.publicDocumentError(404).status, 404);
  assert.equal(status.publicDocumentError(503).headers.get('Retry-After'), '60');
  assert.equal(status.publicDocumentError(404, true).body, null);
  const privateMetadata = load('src/lib/private-metadata.ts').PRIVATE_METADATA;
  assert.equal(privateMetadata.robots.googleBot.index, false);
  console.log('PASS: marca, metadados, 301, FAQ/H1, paginação de sitemap, rascunhos/excluídos, lojas visíveis, avaliações aprovadas e canonical por contexto.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
