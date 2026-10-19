const fs=require('node:fs'),ts=require('typescript'),vm=require('node:vm'),assert=require('node:assert/strict');
let user={id:'creator-a'},calledStore,previewCalls=0,storageError=null;
const token='sbr_live_'+'0'.repeat(64),storeId='10000000-0000-4000-8000-000000000001',foreignJob='20000000-0000-4000-8000-000000000001';
const rows={stores:[{id:storeId,creator_id:'creator-a',nome_loja:'Local fixture'}],platform_product_imports:[{id:foreignJob,store_id:'foreign-store',token_fingerprint:'private-hash',queue:['private-payload']}]};
const db={from:table=>{let selected='*',single=false;const where=[];const query={select(value){selected=value;return query;},eq(key,value){where.push([key,value]);return query;},order(){return query;},limit(){return query;},maybeSingle(){single=true;return query;},then(resolve){const data=rows[table].filter(row=>where.every(([key,value])=>row[key]===value)).map(row=>selected==='*'?row:Object.fromEntries(selected.split(',').map(key=>[key,row[key]])));return Promise.resolve({data:single?(data[0]||null):data,error:table==='platform_product_imports'?storageError:null}).then(resolve);}};return query;}};
const exported={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/api/creator/platform-import/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{
  exports:exported,URL,Response,
  require:key=>({
    '@/lib/api-auth':{getRequestUser:async()=>user},'@/lib/supabase':{supabaseAdmin:db},
    '@/lib/saber-import-errors':{saberImportStorageMessage:error=>error.code==='42501'?'O servidor precisa verificar permissões.':'Não foi possível consultar o banco.'},
    '@/lib/request-rate-limit':{consumeRequestRateLimit:async()=>({allowed:true})},
    '@/lib/saber-export-client':{saberToken:value=>{assert.equal(value,token);return value;},saberFingerprint:()=> 'hash',readSaberExport:async()=>{previewCalls++;return {owner:'source-a',label:'Local fixture',total:0,products:[],nextUrl:null};}},
    '@/lib/saber-import-job':{saberJobColumns:'id,status,source_label',createSaberJob:async store=>{calledStore=store;return {id:'job'};}}
  })[key]
});
const request=(body,origin)=>new Request('https://www.educalizando.com.br/api/creator/platform-import',{method:'POST',headers:{'Content-Type':'application/json',...(origin?{origin}:{})},body:JSON.stringify(body)});
(async()=>{
  user=null;assert.equal((await exported.GET(new Request('https://www.educalizando.com.br/api/creator/platform-import'))).status,401);assert.equal((await exported.POST(request({action:'preview',token}))).status,401);assert.equal(previewCalls,0);
  user={id:'creator-a'};assert.equal((await exported.POST(request({action:'preview',token},'https://evil.test'))).status,403);assert.equal(previewCalls,0);
  let response=await exported.POST(request({action:'preview',token,store_id:'foreign-store'}));assert.equal(response.status,200);assert.equal(previewCalls,1);assert(!JSON.stringify(await response.json()).includes(token));
  response=await exported.POST(request({action:'create',token,expectedOwner:'source-a',store_id:'foreign-store'}));assert.equal(response.status,201);assert.equal(calledStore,storeId);
  response=await exported.POST(request({action:'resume',token,id:foreignJob}));assert.equal(response.status,404);
  response=await exported.GET(new Request('https://www.educalizando.com.br/api/creator/platform-import'));assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'private, no-store');assert.equal((await response.json()).jobs.length,0);
  storageError={code:'42501',message:token};response=await exported.GET(new Request('https://www.educalizando.com.br/api/creator/platform-import'));assert.equal(response.status,503);assert(!(await response.text()).includes(token));
  storageError={code:'42P01'};response=await exported.GET(new Request('https://www.educalizando.com.br/api/creator/platform-import'));assert.equal((await response.json()).available,false);
  console.log('PASS Saber import API: authenticated owner binding, no caller-supplied destination, preview without imports, token not echoed, cross-origin rejection, foreign-job denial and private responses.');
})().catch(error=>{console.error(error);process.exitCode=1;});
