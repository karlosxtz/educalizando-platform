import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

await mkdir('.cloudflare',{recursive:true});
const mocks = {
  '@/lib/supabase': 'export const supabaseAdmin = {from: table => globalThis.__catalogDb.from(table)};',
  '@/lib/request-rate-limit': 'export async function consumeRequestRateLimit(){return {allowed:!globalThis.__catalogLimited,remaining:119,retryAfterSeconds:60};}',
  '@/lib/creator-whatsapp-access': 'export async function resolveCreatorWhatsAppAccess(id){globalThis.__accessStore=id;return {active:!globalThis.__catalogSuspended};}',
  'next/server':'export const NextResponse = Response;',
  'server-only':'',
};
await build({entryPoints:['src/app/api/integrations/store-chatbot/route.ts'],outfile:'.cloudflare/catalog-route-test.mjs',bundle:true,platform:'node',format:'esm',plugins:[{name:'mock-backend',setup(api){api.onResolve({filter:/.*/},args=> args.path in mocks ? {path:args.path,namespace:'mock'} : null);api.onLoad({filter:/.*/,namespace:'mock'},args=>({contents:mocks[args.path],loader:'js'}));}}]});
const {GET} = await import(pathToFileURL(path.resolve('.cloudflare/catalog-route-test.mjs')));
const storeA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', storeB='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const idA='11111111-1111-1111-1111-111111111111',idB='22222222-2222-2222-2222-222222222222';
const key = 'edu_live_'+'a'.repeat(43);
let tables, calls;
function reset(){
  globalThis.__catalogLimited=false;globalThis.__catalogSuspended=false;
  calls=[];
  tables={store_chatbot_api_keys:[{id:'key',store_id:storeA,key_hash:createHash('sha256').update(key).digest('hex'),revoked_at:null}],stores:[{id:storeA,slug:'minha-loja',nome_loja:'Loja A'}],
    products:[{id:idA,store_id:storeA,titulo:'Dia da Árvore',slug:'arvore',descricao:'Ciências e natureza',tipo:'pdf',preco:12,preco_plr:30,is_plr:true,status:'publicado',excluido_em:null,category_ids:['cat'],seasonal_tags:['Dia da Árvore'],capa_url:'javascript:alert(1)',arquivo_url:'PRIVATE'},
      {id:idB,store_id:storeB,titulo:'Produto da outra loja',status:'publicado',excluido_em:null},
      {id:'draft',store_id:storeA,titulo:'Rascunho',status:'rascunho',excluido_em:null},
      {id:'deleted',store_id:storeA,titulo:'Excluído',status:'publicado',excluido_em:'2026-01-01'}],
    categories:[{id:'cat',nome:'Ciências',store_id:null}],education_levels:[],creator_clubs:[],kits:[],creator_club_materials:[]};
}
globalThis.__catalogDb={from(table){
  const filters=[], orders=[];let range=null,update=null,signal;
  const q={select(){return q;},eq(k,v){filters.push(r=>r[k]===v);return q;},is(k,v){filters.push(r=>(r[k]??null)===v);return q;},in(k,vs){filters.push(r=>vs.includes(r[k]));return q;},or(){filters.push(r=>r.store_id==null||r.store_id===storeA);return q;},order(k){orders.push(k);return q;},range(a,b){range=[a,b];return q;},abortSignal(s){signal=s;return q;},update(v){update=v;return q;},maybeSingle(){return execute(true);},then(a,b){return execute(false).then(a,b);}};
  async function execute(single){
    calls.push({table,range,orders});
    if(globalThis.__catalogHang===table) return new Promise(resolve => signal.addEventListener('abort',()=>resolve({data:null,error:{message:'aborted'},count:null}),{once:true}));
    if(signal?.aborted) return {data:null,error:{message:'aborted'},count:null};
    if(globalThis.__catalogFail===table) return {data:null,error:{message:'secret database detail'},count:null};
    let rows=(tables[table]||[]).filter(r=>filters.every(f=>f(r)));
    const count=rows.length;
    if(update) for(const row of rows) Object.assign(row,update);
    if(range) rows=rows.slice(range[0],range[1]+1);
    return {data:single ? rows[0]||null : rows,error:null,count};
  }
  return q;
}};
async function request(query='', auth=key){const response=await GET(new Request('https://attacker.example/api/integrations/store-chatbot'+query,{headers:auth ? {Authorization:'Bearer '+auth} : {}}));const body=await response.json();assert.equal(response.headers.get('Cache-Control'),'private, no-store');assert.ok(body.requestId);assert.equal(response.headers.get('X-Request-ID'),body.requestId);return {response,body};}
reset();let result=await request();assert.equal(result.response.status,200);assert.equal(globalThis.__accessStore,storeA);assert.equal(result.body.products.length,1);assert.equal(result.body.products[0].coverUrl,null);assert.ok(result.body.products[0].publicUrl.startsWith('https://www.educalizando.com.br/loja/minha-loja/'));assert.equal(JSON.stringify(result.body).includes('PRIVATE'),false);assert.equal(JSON.stringify(result.body).includes('Produto da outra loja'),false);
reset();result=await request('?id='+idB);assert.equal(result.response.status,404);
reset();result=await request('?id='+idA);assert.equal(result.response.status,200);assert.equal(result.body.products[0].id,idA);assert.equal(calls.some(c=>c.table==='kits'||c.table==='creator_clubs'),false);
reset();result=await request('?section=facets');assert.equal(result.body.facets.categories[0].name,'Ciências');assert.equal('products' in result.body,false);
reset();result=await request('?category=ciencias&month=9&pageSize=1&view=compact');assert.equal(result.body.pagination.products.total,1);assert.equal(result.body.products[0].description,undefined);
reset();result=await request('?q=impossivel&suggestions=true');assert.equal(result.body.products.length,0);
reset();result=await request('?page=0');assert.equal(result.response.status,400);assert.equal(result.body.code,'INVALID_QUERY');
reset();result=await request('',null);assert.equal(result.response.status,401);assert.equal(calls.length,0);
reset();tables.store_chatbot_api_keys[0].revoked_at='today';result=await request();assert.equal(result.response.status,401);assert.equal(calls.some(c=>c.table==='products'),false);
reset();globalThis.__catalogSuspended=true;result=await request();assert.equal(result.response.status,403);assert.equal(calls.some(c=>c.table==='products'),false);
reset();globalThis.__catalogLimited=true;result=await request();assert.equal(result.response.status,429);assert.equal(result.response.headers.get('Retry-After'),'60');assert.equal(calls.length,0);
reset();globalThis.__catalogFail='products';result=await request();assert.equal(result.response.status,503);assert.equal(JSON.stringify(result.body).includes('secret database'),false);globalThis.__catalogFail=null;
reset();globalThis.__catalogFail='store_chatbot_api_keys';result=await request();assert.equal(result.response.status,503);globalThis.__catalogFail=null;
reset();tables.categories[0].store_id=storeB;result=await request('?section=facets');assert.equal(result.body.facets.categories[0].name,null,'Do not resolve a private category of another store');
reset();tables.products[0].preco_plr=null;result=await request('?section=plr');assert.equal(result.body.plrProducts[0].plr.price,null);assert.match(result.body.plrProducts[0].whatsapp.message,/Preço indisponível/);
reset();globalThis.__catalogHang='products';const originalTimeout=globalThis.setTimeout;globalThis.setTimeout=(callback,ms,...args)=>originalTimeout(callback,ms===20000?5:ms,...args);result=await request();globalThis.setTimeout=originalTimeout;globalThis.__catalogHang=null;assert.equal(result.response.status,503);assert.equal(result.body.code,'CATALOG_TIMEOUT');
reset();tables.products=Array.from({length:5001},(_,i)=>({...tables.products[0],id:String(i)}));result=await request('?section=products&page=2&pageSize=100');assert.equal(result.body.products.length,100);assert.equal(result.body.catalogCoverage.products.loaded,5000);assert.equal(result.body.catalogCoverage.products.total,5001);assert.equal(result.body.catalogCoverage.products.truncated,true);assert.equal(calls.filter(c=>c.table==='products').length,5);
console.log('Endpoint validado: isolamento entre lojas, revogação, suspensão, autenticação, erros seguros, facetas e catálogo com 5.001 produtos.');
