const assert = require('node:assert/strict'), fs = require('node:fs');
const { PGlite } = require('../.cloudflare/sql-test/node_modules/@electric-sql/pglite');
async function main() {
  const db = new PGlite();
  try {
    await db.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE TABLE public.stores(id uuid primary key);');
    const migration = fs.readFileSync('supabase/migrations/20261016200000_create_store_search_gaps.sql', 'utf8');
    await db.exec(migration); await db.exec(migration);
    const storeA = '00000000-0000-0000-0000-000000000001', storeB = '00000000-0000-0000-0000-000000000002';
    await db.query('insert into stores values ($1),($2)', [storeA, storeB]);
    async function insert(id, store, query, normalized, scope, age = 0) {
      await db.query("insert into store_search_gaps(id,store_id,query,normalized_query,scope,collection,created_at) values ($1,$2,$3,$4,$5,'all',now()-make_interval(days=>$6))", [id, store, query, normalized, scope, age]);
    }
    const event = '10000000-0000-0000-0000-000000000001';
    await insert(event, storeA, 'alfabetização', 'alfabetizacao', 'catalog');
    await assert.rejects(insert(event, storeA, 'alfabetização', 'alfabetizacao', 'catalog'), /duplicate key/);
    await insert('10000000-0000-0000-0000-000000000002', storeA, 'alfabetizacao', 'alfabetizacao', 'filters', 10);
    await insert('10000000-0000-0000-0000-000000000003', storeB, 'segredo de outra loja', 'segredo de outra loja', 'catalog');
    await insert('10000000-0000-0000-0000-000000000004', storeA, 'muito antigo', 'muito antigo', 'catalog', 95);
    const report = async (days = 30, scope = 'all') => (await db.query('select report_store_search_gaps($1,$2,$3) as data', [storeA, days, scope])).rows[0].data;
    let data = await report();
    assert.equal(data.total, 2); assert.equal(data.catalog_total, 1); assert.equal(data.filtered_total, 1); assert.equal(data.distinct_terms, 1); assert.equal(data.terms[0].count, 2);
    assert.equal((await report(7)).total, 1); assert.equal((await report(30, 'filters')).total, 1); assert.equal((await report(90)).total, 2);
    await db.query("insert into store_search_gaps(id,store_id,query,normalized_query,scope,collection) select gen_random_uuid(),$1,'tema '||n,'tema '||n,'catalog','all' from generate_series(1,2500) n", [storeA]);
    data = await report(); assert.equal(data.total, 2502); assert.equal(data.distinct_terms, 2501); assert.equal(data.terms.length, 100);
    assert.equal(data.terms[0].count, 2); assert.ok(!JSON.stringify(data).includes('segredo'));
    const grants = await db.query("select has_function_privilege('authenticated','public.report_store_search_gaps(uuid,integer,text)','execute') as auth,has_function_privilege('anon','public.report_store_search_gaps(uuid,integer,text)','execute') as anon,has_table_privilege('anon','public.store_search_gaps','select') as read");
    assert.deepEqual(grants.rows[0], { auth: false, anon: false, read: false });
    await db.exec('SET ROLE anon'); await assert.rejects(db.query('select * from store_search_gaps'), /permission denied/); await db.exec('RESET ROLE');
    console.log('PASS SQL: migration applied twice, private permissions, cross-store separation, accent groups, periods/scopes, event idempotency and exact totals beyond 2,000 events.');
  } finally { await db.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
