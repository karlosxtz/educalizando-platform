const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const clubId = '22222222-2222-4222-8222-222222222222';
const oldId = '33333333-3333-4333-8333-333333333333';
const newId = '44444444-4444-4444-8444-444444444444';
const storeId = '11111111-1111-4111-8111-111111111111';
let clubs = new Map(), materials = new Map(), actions = [], failWrite = false;
const db = { from(table) {
  const q = { filters: {}, eq(k,v){this.filters[k]=v;return this;}, is(){return this;}, select(){return this;},
    in(k,v){this.filters[k]=v;return this;}, insert(v){this.operation='insert';this.value=v;return this;},
    update(v){this.operation='update';this.value=v;return this;}, delete(){this.operation='delete';return this;},
    upsert(v){this.operation='upsert';this.value=v;return this;},
    async maybeSingle(){if(table==='stores')return{data:{id:storeId,creator_id:'user',slug:'store'}};
      const club=clubs.get(this.filters.id);return{data:club?.store_id===storeId?club:null};},
    async single(){if(this.operation==='insert'){if(clubs.has(this.value.id))return{error:{code:'23505'}};clubs.set(this.value.id,this.value);actions.push('draft');return{data:this.value};}
      const saved={...clubs.get(this.filters.id),...this.value};clubs.set(saved.id,saved);actions.push('metadata');return{data:saved};},
    then(resolve,reject){return Promise.resolve().then(()=>{
      if(table==='products')return{data:(this.filters.id||[]).map(id=>({id,is_plr:true,has_plr_delivery:true}))};
      if(this.operation==='upsert'){actions.push('write');if(failWrite)return{error:new Error('storage unavailable')};for(const row of this.value){const set=materials.get(row.club_id)||new Set();set.add(row.product_id);materials.set(row.club_id,set);}return{error:null};}
      if(this.operation==='delete'){actions.push('delete');for(const id of this.filters.product_id||[])materials.get(this.filters.club_id)?.delete(id);return{error:null};}
      return{data:[...(materials.get(this.filters.club_id)||[])].map(product_id=>({product_id}))};
    }).then(resolve,reject);}
  };return q;
}};
const mocks={'@/lib/api-auth':{getRequestUser:async()=>({id:'user'})},'@/lib/supabase':{supabaseAdmin:db},
  '@/lib/creator-club':{creatorClubMaterialEligible:()=>true,creatorClubSlug:()=> 'club'},
  '@/lib/public-links':{normalizePublicAssetUrl:x=>x},'next/server':{NextResponse:Response}};
const exportsObject={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/api/creator-clubs/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,
 {exports:exportsObject,require:n=>mocks[n]||require(n),Response,Request,URL,Set,console:{error(){}}});
const body={creation_request_id:clubId,name:'Club test',monthlyPrice:10,status:'published',productIds:[newId]};
const submit=payload=>exportsObject.PUT(new Request('https://www.educalizando.com.br/api/creator-clubs',{method:'PUT',body:JSON.stringify(payload)}));
(async()=>{
 failWrite=true;assert.equal((await submit(body)).status,500);assert.equal(clubs.get(clubId).status,'draft');
 assert.deepEqual(actions,['draft','write']);failWrite=false;actions=[];
 assert.equal((await submit(body)).status,200);assert.equal(clubs.size,1);assert.equal(clubs.get(clubId).status,'published');assert.deepEqual(actions,['write','metadata']);
 materials.set(clubId,new Set([oldId]));actions=[];failWrite=true;
 assert.equal((await submit({...body,id:clubId,name:'Changed'})).status,500);
 assert.deepEqual([...materials.get(clubId)],[oldId]);assert.equal(clubs.get(clubId).name,'Club test');assert.deepEqual(actions,['write']);
 failWrite=false;actions=[];assert.equal((await submit({...body,id:clubId})).status,200);
 assert.deepEqual([...materials.get(clubId)],[newId]);assert.deepEqual(actions,['write','delete','metadata']);
 const foreign={...clubs.get(clubId),store_id:'foreign'};clubs.set(clubId,foreign);
 assert.equal((await submit(body)).status,500);assert.equal(clubs.get(clubId),foreign);
 assert.equal((await submit({...body,productIds:['bad-id']})).status,400);
 assert.equal((await submit({...body,id:clubId,productIds:[123]})).status,400);
 assert.equal((await submit(null)).status,400);
 console.log('PASS: club retries reuse one ID; partial creation stays draft; failed replacement preserves previous materials and metadata; successful replacement writes before removal; store isolation.');
})().catch(e=>{console.error(e);process.exitCode=1;});
