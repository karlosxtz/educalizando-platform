/* Isolated PostgreSQL test. Install PGlite only under .cloudflare/sql-test. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { PGlite } = require('../.cloudflare/sql-test/node_modules/@electric-sql/pglite');
const sql = fs.readFileSync('supabase/migrations/20261016150000_create_private_store_webhooks.sql', 'utf8');
const a='11111111-1111-4111-8111-111111111111', b='22222222-2222-4222-8222-222222222222';
(async()=>{
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
      create table public.stores(id uuid primary key);
      create table public.orders(id text primary key,store_id uuid references stores(id),status text,total_amount numeric,payment_method text,created_at timestamptz default now(),paid_at timestamptz,buyer_email text);
      create table public.products(id uuid primary key,store_id uuid references stores(id),titulo text,descricao text,status text,visualizacoes integer default 0);
      create table public.creator_clubs(id uuid primary key,store_id uuid references stores(id),name text,status text);
      insert into stores values('${a}'),('${b}');`);
    await db.exec(sql);
    await db.exec(sql); // Re-running must not duplicate triggers or erase records.
    const privateTables = await db.query(`select relrowsecurity from pg_class where relname in ('store_webhook_endpoints','store_webhook_events','store_webhook_deliveries')`);
    assert.equal(privateTables.rows.length,3);
    assert.ok(privateTables.rows.every(row=>row.relrowsecurity));
    const perms=await db.query(`select has_table_privilege('authenticated','public.store_webhook_endpoints','SELECT') as browser,
      has_table_privilege('anon','public.store_webhook_events','SELECT') as anonymous,
      has_function_privilege('authenticated','public.claim_store_webhook_deliveries(integer,uuid)','EXECUTE') as claim,
      has_function_privilege('service_role','public.claim_store_webhook_deliveries(integer,uuid)','EXECUTE') as server`);
    assert.deepEqual(perms.rows[0],{browser:false,anonymous:false,claim:false,server:true});
    const ep=await db.query(`insert into store_webhook_endpoints(store_id,name,provider,url,secret_encrypted,events)
      values($1,'A','generic','https://receiver.example/webhook','encrypted',array['order.created','order.paid','product.updated','club.updated']) returning id`,[a]);
    const epId=ep.rows[0].id;
    const other=await db.query(`insert into store_webhook_endpoints(store_id,name,provider,url,secret_encrypted,events)
      values($1,'B','generic','https://receiver.example/webhook','encrypted',array['order.created']) returning id`,[b]);
    await db.query(`insert into orders(id,store_id,status,total_amount,payment_method,buyer_email) values('order-a',$1,'pending',10,'pix','private@example.invalid')`,[a]);
    await db.query(`insert into orders(id,store_id,status,total_amount,payment_method) values('order-b',$1,'pending',20,'pix')`,[b]);
    await db.exec(`update orders set status='paid',paid_at=now() where id='order-a'; update orders set total_amount=11 where id='order-a';`);
    const events=await db.query('select * from store_webhook_events where store_id=$1 order by created_at,type',[a]);
    assert.equal(events.rows.length,2,'Only creation and status transition emit order events');
    assert.ok(events.rows.every(row=>!JSON.stringify(row.data).includes('private@example.invalid')),'Snapshot never stores buyer PII');
    const eventA=events.rows.find(row=>row.type==='order.created').id;
    await assert.rejects(db.query(`insert into store_webhook_deliveries(store_id,endpoint_id,event_id,endpoint_version) values($1,$2,$3,1)`,[b,other.rows[0].id,eventA]),/foreign key/i);
    let claimed=await db.query('select * from claim_store_webhook_deliveries(10,$1)',[a]);
    assert.equal(claimed.rows.length,1,'Later payment waits for earlier creation of same order');
    assert.equal(claimed.rows[0].store_id,a,'Store-scoped dispatch never claims another merchant');
    assert.equal(claimed.rows[0].attempts,1);
    assert.ok(claimed.rows[0].lease_token);
    assert.equal((await db.query('select * from claim_store_webhook_deliveries(10,$1)',[a])).rows.length,0,'A live lease cannot be claimed twice');
    await db.query(`update store_webhook_deliveries set leased_until=now()-interval '1 minute' where id=$1`,[claimed.rows[0].id]);
    const reclaimed=await db.query('select * from claim_store_webhook_deliveries(10,$1)',[a]);
    assert.equal(reclaimed.rows[0].attempts,2);
    assert.notEqual(reclaimed.rows[0].lease_token,claimed.rows[0].lease_token,'Recovery invalidates the stale worker token');
    await db.query(`update store_webhook_deliveries set status='delivered',leased_until=null where id=$1`,[reclaimed.rows[0].id]);
    claimed=await db.query('select * from claim_store_webhook_deliveries(10,$1)',[a]);
    assert.equal(claimed.rows.length,1);
    assert.equal(claimed.rows[0].event_id,events.rows.find(row=>row.type==='order.paid').id);
    await db.query(`update store_webhook_deliveries set attempts=8,leased_until=now()-interval '1 minute' where id=$1`,[claimed.rows[0].id]);
    await db.query('select * from claim_store_webhook_deliveries(10,$1)',[a]);
    assert.equal((await db.query('select status from store_webhook_deliveries where id=$1',[claimed.rows[0].id])).rows[0].status,'failed');
    await db.query(`insert into products values(gen_random_uuid(),$1,'Material','Conteudo','publicado',0)`,[a]);
    await db.exec('update products set visualizacoes=1;');
    assert.equal((await db.query(`select count(*)::int as count from store_webhook_events where type like 'product.%'`)).rows[0].count,0,'Page views cannot flood the outbox');
    await db.exec(`update products set titulo='Material revisado';`);
    assert.equal((await db.query(`select count(*)::int as count from store_webhook_events where type='product.updated'`)).rows[0].count,1);
    await db.query(`update store_webhook_endpoints set enabled=false where id=$1`,[epId]);
    await db.query('select * from claim_store_webhook_deliveries(10,$1)',[a]);
    assert.equal((await db.query(`select count(*)::int as count from store_webhook_deliveries where store_id=$1 and status='pending'`,[a])).rows[0].count,0,'Paused configuration cancels unsent old deliveries');
    for(let i=0;i<9;i++)await db.query(`insert into store_webhook_endpoints(store_id,name,provider,url,secret_encrypted,events) values($1,$2,'generic','https://receiver.example/webhook','encrypted',array['webhook.test'])`,[a,'Extra '+i]);
    await assert.rejects(db.query(`insert into store_webhook_endpoints(store_id,name,provider,url,secret_encrypted,events) values($1,'Too many','generic','https://receiver.example/webhook','encrypted',array['webhook.test'])`,[a]),/10 integracoes/);
    console.log('PASS: SQL executed twice in isolated PostgreSQL; privacy, cross-store foreign keys, event capture, queue ordering, leases, retry cap and endpoint cap.');
  } finally { await db.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
