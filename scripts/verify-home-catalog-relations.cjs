const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const selections = [];
const fixture = { id: 'product-fixture', store_id: 'store-fixture', titulo: 'Fixture de teste', capa_url: 'https://example.test/cover.webp', store: { id: 'store-fixture', nome_loja: 'Fixture' } };
const db = { from(table) {
  assert.equal(table, 'products'); let fields;
  const query = {};
  for (const method of ['eq', 'is', 'order', 'limit', 'gt']) query[method] = () => query;
  query.select = value => { fields = value; selections.push(value); return query; };
  query.then = resolve => Promise.resolve(fields.includes('store:stores!products_store_id_fkey')
    ? { data: [fixture], error: null }
    : { data: null, error: { code: 'PGRST201', message: 'Ambiguous products/stores relationship' } }).then(resolve);
  return query;
} };
const exportsObject = {};
const mocks = {
  './supabase': { supabase: db },
  './product-local-storage': { getDeletedProductIds: () => new Set(), getLocalProducts: () => [] },
  './product-write-service': { isValidUUID: () => true },
};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/product-read-service.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports: exportsObject, require: name => mocks[name] || require(name), process: { env: { NEXT_PUBLIC_SUPABASE_URL: 'https://fixture.supabase.co' } }, console });
(async () => {
  for (const read of [() => exportsObject.getAllPublicMarketplaceProducts(1000, 'cards'), () => exportsObject.getAllFreeProducts('cards')]) {
    const products = await read();
    assert.equal(products.length, 1, 'Additional metrics relationship must not empty the catalogue');
    assert.equal(products[0].capa_url, fixture.capa_url);
    assert.equal(products[0].store.id, fixture.store_id);
  }
  for (const fields of selections) assert(!fields.includes('*'), 'Homepage uses only public card fields');
  const home = fs.readFileSync('src/app/page.tsx', 'utf8');
  assert.match(home, /export const revalidate = 0;/, 'ISR must not persist empty home fallbacks');
  const discovery = fs.readFileSync('src/lib/discovery-catalog.ts', 'utf8');
  assert(discovery.includes('store:stores!products_store_id_fkey('));
  console.log('PASS home: explicit owning-store relationship survives metrics join, covers preserved, public card fields only, discovery fixed and no persistent ISR empty fallback.');
})().catch(error => { console.error(error); process.exitCode = 1; });
