const assert = require('node:assert/strict'), fs = require('node:fs');
const { PGlite } = require('../.cloudflare/sql-test/node_modules/@electric-sql/pglite');
async function main() {
 const db = new PGlite();
 try {
  await db.exec('create role anon;create role authenticated;create role service_role;create table stores(id uuid primary key);create table orders(id text primary key,store_id uuid,status text);');
  const sql = fs.readFileSync('supabase/migrations/20261016220000_create_store_cart_recovery.sql','utf8'); await db.exec(sql); await db.exec(sql);
  const store='00000000-0000-0000-0000-000000000001', other='00000000-0000-0000-0000-000000000002', browser='10000000-0000-0000-0000-000000000001', child='10000000-0000-0000-0000-000000000002';
  await db.query('insert into stores values($1),($2)',[store,other]);
  const items=[{productId:'20000000-0000-0000-0000-000000000001',title:'Material',quantity:1,price:12,isPlr:false}];
  const save=async (token=browser, cart=items, contact=null,parent=null,stage='cart')=>db.query('select save_store_cart($1,$2,$3,12,$4,$5,$6)',[store,token,JSON.stringify(cart),stage,contact?JSON.stringify(contact):null,parent]);
  const report=async (id=store)=>(await db.query('select report_store_carts($1,30) as r',[id])).rows[0].r;
  await save(); await save(); let r=await report(); assert.equal(r.total,1);assert.equal(r.active,1);assert.equal(r.carts[0].phone,null);assert.ok(!('browser_token' in r.carts[0]));
  assert.equal((await report(other)).total,0);
  await save(browser,items,{consent:true,name:'Cliente',phone:'5511999999999'}); await save(); r=await report();assert.equal(r.carts[0].phone,'5511999999999');assert.ok(r.carts[0].consent_at);
  await save(browser,items,{consent:false});r=await report();assert.equal(r.carts[0].phone,null);assert.equal(r.carts[0].consent_at,null);
  await db.exec("update store_cart_recovery set updated_at=now()-interval '21 minutes'");r=await report();assert.equal(r.abandoned,1);assert.equal(r.recoverable_value,12);
  const token=r.carts[0].recovery_token;await save(child,items,null,token,'checkout');r=await report();assert.equal(r.total,2);
  await db.query("insert into orders values('own-order',$1,'pending'),('foreign-order',$2,'pending')",[store,other]);
  await db.query("select link_store_cart_order($1,$2,'foreign-order')",[store,child]);assert.equal((await db.query('select order_id from store_cart_recovery where browser_token=$1',[child])).rows[0].order_id,null);
  await db.query("select link_store_cart_order($1,$2,'own-order')",[store,child]);assert.equal((await db.query('select stage from store_cart_recovery where browser_token=$1',[child])).rows[0].stage,'payment');
  await save(child,items,null,null,'checkout');assert.equal((await db.query('select stage from store_cart_recovery where browser_token=$1',[child])).rows[0].stage,'payment');
  const changed=await save(child,[{...items[0],quantity:2}]);assert.equal(changed.rows[0].save_store_cart,'rotate');assert.equal((await db.query('select order_id from store_cart_recovery where browser_token=$1',[child])).rows[0].order_id,'own-order');
  await db.exec("update orders set status='paid' where id='own-order'");r=await report();assert.equal(r.converted,2,'Converted recovered cart also closes its original cart');assert.equal(r.abandoned,0);
  await save();r=await report();assert.equal(r.converted,2,'Delayed browser writes cannot resurrect a paid cart');
  const third='10000000-0000-0000-0000-000000000003'; await save(third,[],null);r=await report();assert.equal(r.carts.find(c=>c.state==='cleared').items.length,0);
  await assert.rejects(save(third,Array.from({length:21},()=>items[0])),/invalid cart/);
  const fourth='10000000-0000-0000-0000-000000000004';await save(fourth);await db.query("update store_cart_recovery set created_at=now()-interval '8 days' where browser_token=$1",[fourth]);assert.ok((await report()).carts.some(c=>c.state==='expired'));
  const grants=(await db.query("select has_function_privilege('authenticated','report_store_carts(uuid,integer)','execute') as auth,has_table_privilege('anon','store_cart_recovery','select') as anon")).rows[0];assert.deepEqual(grants,{auth:false,anon:false});
  console.log('PASS SQL: migration twice, anonymous carts, consent grant/revoke, inactivity, scopes, server order linkage, recovered-parent conversion, no paid-cart resurrection, limits and private permissions.');
 } finally {await db.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
