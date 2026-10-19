const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
function load(file,mocks={},globals={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,{exports,require:name=>mocks[name]||require(name),URL,URLSearchParams,Request,Response,crypto:require('node:crypto').webcrypto,console,...globals});return exports;}
const input=load('src/lib/creator-blog-input.ts');
const body={title:'Ideias para uma aula com jogos',excerpt:'Uma dica prática para organizar uma atividade com a turma.',content:'Uma experiência real contada pelo criador. '.repeat(12),status:'published',topic:'Planejamento',cover_url:''};
assert.equal(input.creatorBlogInput({...body,store_id:'forged',slug:'forged',published_at:'2000-01-01'}).store_id,undefined);
for(const patch of [{status:'deleted'},{title:'x'},{excerpt:'x'},{content:'x'},{content:'a'.repeat(30001)},{topic:'Outro tema arbitrário'},{cover_url:'javascript:alert(1)'},{cover_url:'https://evil.test/private.jpg'},{cover_url:'https://arquivos.educalizando.com.br/private-files/file'}])assert.throws(()=>input.creatorBlogInput({...body,...patch}));
assert(input.creatorBlogInput({...body,cover_url:'https://arquivos.educalizando.com.br/public-images/cover.webp'}).cover_url);
assert.match(input.creatorBlogSlug('Água & Educação!','10000000-0000-4000-8000-000000000001'),/^agua-educacao-10000000000040008000000000000001$/);
const link={__esModule:true,default:({href,children,...props})=>React.createElement('a',{href,...props},children)};
const Article=load('src/components/blog/BlogArticleBody.tsx',{'next/link':link}).default;
const html=renderToStaticMarkup(React.createElement(Article,{content:'## Ideias\n\n- Uma proposta\n- Outra proposta\n\n<script>alert(1)</script>\n\nhttps://example.test/idea'}));
assert.match(html,/<h2/);assert.match(html,/<ul/);assert.doesNotMatch(html,/<script>/);assert.match(html,/&lt;script&gt;/);assert.match(html,/nofollow ugc noopener noreferrer/);assert.doesNotMatch(html,/<h1/);
let user={id:'owner-a'},rateAllowed=true,invalidations=0;
const storeA='10000000-0000-4000-8000-000000000001',storeB='10000000-0000-4000-8000-000000000002';
const rows=[{id:'20000000-0000-4000-8000-000000000001',store_id:storeB,...body,slug:'other-store',published_at:'2026-01-01T00:00:00Z'}];
const stores=[{id:storeA,creator_id:'owner-a',nome_loja:'Loja de teste A',slug:'test-a'}];
const db={from:table=>{const filters=[];let action='read',payload,single=false;const query={
  select(){return query;},eq(key,value){filters.push([key,value]);return query;},order(){return query;},limit(){return query;},range(){return query;},maybeSingle(){single=true;return query;},insert(value){action='insert';payload=value;return query;},update(value){action='update';payload=value;return query;},
  then(resolve){let data=(table==='stores'?stores:rows).filter(row=>filters.every(([key,value])=>row[key]===value));if(action==='insert'){rows.push(payload);data=[payload];}if(action==='update'){for(const row of data)Object.assign(row,payload);}return Promise.resolve({data:single?(data[0]||null):data,count:data.length,error:null}).then(resolve);}
};return query;}};
const api=load('src/app/api/creator/blog/route.ts',{
  '@/lib/creator-blog-input':input,
  '@/lib/api-auth':{getRequestUser:async()=>user},
  '@/lib/supabase':{supabaseAdmin:db},
  '@/lib/public-cache-invalidation':{invalidatePublicCatalog:async()=>{invalidations++;return true;}},
  '@/lib/request-rate-limit':{consumeRequestRateLimit:async()=>({allowed:rateAllowed}),rateLimitResponse:()=>new Response('{}',{status:429})},
  'next/server':{NextResponse:{json:(data,init={})=>new Response(JSON.stringify(data),{...init,headers:{'Content-Type':'application/json',...init.headers}})}}
});
const request=(method,data,query='')=>new Request('https://www.educalizando.com.br/api/creator/blog'+query,{method,...(data?{body:JSON.stringify(data),headers:{'Content-Type':'application/json'}}:{})});
(async()=>{
  user=null;assert.equal((await api.GET(request('GET'))).status,401);assert.equal((await api.POST(request('POST',body))).status,401);
  user={id:'no-store'};assert.equal((await api.GET(request('GET'))).status,403);
  user={id:'owner-a'};
  let response=await api.POST(request('POST',{...body,store_id:storeB}));assert.equal(response.status,201);const created=(await response.json()).post;assert.equal(created.store_id,storeA);assert.equal(created.status,'published');assert(created.published_at);assert.equal(response.headers.get('cache-control'),'private, no-store');
  assert.equal((await api.PUT(request('PUT',{...body,id:rows[0].id}))).status,404);assert.equal(rows[0].slug,'other-store');
  response=await api.GET(request('GET'));let data=await response.json();assert.equal(data.posts.length,1);assert.equal(data.posts[0].id,created.id);
  response=await api.GET(request('GET',null,'?id='+rows[0].id));assert.equal((await response.json()).posts.length,0);
  response=await api.PUT(request('PUT',{...body,id:created.id,title:'Uma nova versão do meu artigo',status:'draft',slug:'replace-me'}));data=(await response.json()).post;assert.equal(data.status,'draft');assert.equal(data.published_at,null);assert.equal(data.slug,created.slug);
  assert.equal((await api.PUT(request('PUT',{...body,id:created.id,content:'short'}))).status,400);
  rateAllowed=false;assert.equal((await api.POST(request('POST',body))).status,429);assert.equal(invalidations,2);
  const publicService=fs.readFileSync('src/lib/blog-service.ts','utf8');assert(publicService.includes(".eq('status','published').lte('published_at'"));
  console.log('PASS creator blog: authentication, owner isolation, no forged attribution, bounded input, safe text rendering, private drafts, publication, stable slug, unpublish, cache invalidation and rate limit.');
})().catch(error=>{console.error(error);process.exitCode=1;});
