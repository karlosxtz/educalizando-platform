import assert from 'node:assert/strict';
import { publicPageCacheKey, fetchPublicPage } from '../cloudflare/public-page-cache.js';
const base='https://www.educalizando.com.br';
const request=(path='/',init)=>new Request(base+path,init);
const entries=new Map(), tasks=[];
const cache={match:async key=>entries.get(key.url)?.clone(),put:async(key,response)=>{entries.set(key.url,new Response(await response.arrayBuffer(),response));}};
const ctx={waitUntil:task=>tasks.push(task)};
let renders=0;
const render=async()=>{renders++;return new Response('<html>public</html>',{headers:{'Content-Type':'text/html','X-Educalizando-Public-Document':'1','Cache-Control':'private, no-cache, no-store','Vary':'RSC, Next-Router-State-Tree, Accept-Encoding'}});};
const first=await fetchPublicPage(request(),ctx,render,cache);assert.equal(first.headers.get('X-Educalizando-Page-Cache'),'MISS');assert.ok((await first.text()).includes('public'));
await Promise.all(tasks.splice(0));
const second=await fetchPublicPage(request(),ctx,render,cache);assert.equal(second.headers.get('X-Educalizando-Page-Cache'),'HIT');assert.equal(renders,1);assert.match(second.headers.get('Cache-Control'),/max-age=0/);
for(const path of ['/admin','/dashboard','/login','/cliente','/aluno','/api/produtos','/loja/test/checkout','/?q=private','/buscar?q=test','/videos?q=test','/marketplace-de-materiais-pedagogicos?pagina=2'])assert.equal(publicPageCacheKey(request(path)),null,path);
for(const headers of [{Cookie:'session=one'},{Authorization:'Bearer test'},{RSC:'1'},{'Next-Router-Prefetch':'1'},{'Next-Router-State-Tree':'state'},{'Accept':'text/x-component'},{Range:'bytes=0-100'},{'Cache-Control':'no-cache'}]) {
 assert.equal(publicPageCacheKey(request('/',{headers})),null);await fetchPublicPage(request('/',{headers}),ctx,render,cache);
}
assert.equal(publicPageCacheKey(request('/',{method:'POST'})),null);
assert.equal(publicPageCacheKey(new Request('https://other.test/')),null);
for(const [status,headers] of [[500,{}],[404,{}],[200,{'Set-Cookie':'user=one'}],[200,{'Content-Type':'text/x-component'}],[200,{'Content-Encoding':'gzip'}],[200,{'X-Educalizando-Public-Document':'0'}]]) {
 const response=await fetchPublicPage(request('/loja/test'),ctx,async()=>new Response('data',{status,headers:{'Content-Type':'text/html','X-Educalizando-Public-Document':'1',...headers}}),cache);
 assert.equal(response.headers.get('X-Educalizando-Page-Cache'),null);assert.equal(tasks.length,0);
}
const brokenCache={match:async()=>{throw new Error('cache unavailable');},put:async()=>{throw new Error('write unavailable');}};
assert.equal((await fetchPublicPage(request(),ctx,render,brokenCache)).status,200);await Promise.all(tasks.splice(0));
console.log('PASS: public cache avoids rendering on HIT; sessions, payments, APIs, RSC, queries and errors bypass cache; only explicitly public documents are eligible; cache failures preserve availability.');
// Expiry and catalogue revision are independent: mutations cannot reuse old HTML.
let clock=1_000_000;
const time=()=>clock;
const before=renders;
await fetchPublicPage(request('/categorias/artes'),ctx,render,cache,'r1',time);await Promise.all(tasks.splice(0));
assert.equal((await fetchPublicPage(request('/categorias/artes'),ctx,render,cache,'r1',time)).headers.get('X-Educalizando-Page-Cache'),'HIT');
assert.equal(renders,before+1);
clock+=3601_000;
assert.equal((await fetchPublicPage(request('/categorias/artes'),ctx,render,cache,'r1',time)).headers.get('X-Educalizando-Page-Cache'),'STALE');
await Promise.all(tasks.splice(0));await Promise.all(tasks.splice(0));
assert.equal((await fetchPublicPage(request('/categorias/artes'),ctx,render,cache,'r1',time)).headers.get('X-Educalizando-Page-Cache'),'HIT');
assert.equal((await fetchPublicPage(request('/categorias/artes'),ctx,render,cache,'r2',time)).headers.get('X-Educalizando-Page-Cache'),'MISS');await Promise.all(tasks.splice(0));
const bypass=await fetchPublicPage(request('/categorias/artes'),ctx,render,cache,null,time);assert.equal(bypass.headers.get('X-Educalizando-Page-Cache'),null);
clock+=4000_000;
assert.equal((await fetchPublicPage(request('/categorias/artes'),ctx,render,cache,'r2',time)).headers.get('X-Educalizando-Page-Cache'),'MISS');await Promise.all(tasks.splice(0));
const {readPublicCacheRevision,PUBLIC_CACHE_REVISION_KEY}=await import('../cloudflare/cache-revision.js');let reads=0;
assert.equal(await readPublicCacheRevision({get:async(key,options)=>{assert.equal(key,PUBLIC_CACHE_REVISION_KEY);assert.equal(options.cacheTtl,30);reads++;return 'revision';}}),'revision');assert.equal(reads,1);
assert.equal(await readPublicCacheRevision(undefined),null);assert.equal(await readPublicCacheRevision({get:async()=>{throw Error('offline');}}),null);
console.log('PASS: cache 1h, SWR, expiração, revisão compartilhada e falha de KV sem HTML obsoleto.');
const transitionPath = '/produto/transicao';
const freshRevision = `${clock}:updated`;
const sizeBefore = entries.size;
const transition=await fetchPublicPage(request(transitionPath),ctx,render,cache,freshRevision,time);
assert.equal(transition.headers.get('Cloudflare-CDN-Cache-Control'),'no-store');
assert.doesNotMatch(transition.headers.get('Cache-Control'),/s-maxage/);
assert.equal(entries.size,sizeBefore); assert.equal(tasks.length,0,'No edge fill while KV tags propagate');
clock+=121_000;
const staleIsr=()=>new Response('old',{headers:{'Content-Type':'text/html','X-Educalizando-Public-Document':'1','X-Vinext-Cache':'STALE'}});
await fetchPublicPage(request(transitionPath),ctx,staleIsr,cache,freshRevision,time);
assert.equal(tasks.length,0,'An ISR STALE response must not become fresh edge HTML');
assert.equal(entries.size,sizeBefore);
assert.equal((await fetchPublicPage(request(transitionPath),ctx,render,cache,freshRevision,time)).headers.get('X-Educalizando-Page-Cache'),'MISS');
await Promise.all(tasks.splice(0));
assert.equal((await fetchPublicPage(request(transitionPath),ctx,render,cache,freshRevision,time)).headers.get('X-Educalizando-Page-Cache'),'HIT');
console.log('PASS: transição após edição não prolonga HTML stale do ISR no cache de borda.');
// Existing editorial landings use public RLS data and the same catalogue revision.
for (const path of ['/marketplace-de-materiais-pedagogicos','/videos','/materiais-didaticos','/recursos-pedagogicos','/atividades-alfabetizacao','/educacao-infantil','/planos-de-aula-bncc','/atividades-para-imprimir','/jogos-pedagogicos','/atividades-ensino-fundamental']) {
 const start = renders;
 await fetchPublicPage(request(path),ctx,render,cache,'editorial-v1'); await Promise.all(tasks.splice(0));
 assert.equal((await fetchPublicPage(request(path),ctx,render,cache,'editorial-v1')).headers.get('X-Educalizando-Page-Cache'),'HIT');
 assert.equal(renders,start+1);
 assert.equal(publicPageCacheKey(request(path,{headers:{Cookie:'session=one'}})),null);
 assert.equal(publicPageCacheKey(request(path+'?q=teste')),null);
 assert.notEqual(publicPageCacheKey(request(path),'before').url,publicPageCacheKey(request(path),'after').url);
}
console.log('PASS: oito páginas editoriais usam cache com revisão do catálogo; sessões e filtros continuam fora.');
