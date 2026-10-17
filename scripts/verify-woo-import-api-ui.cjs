const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
function load(file,mocks){const exports={};const output=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;vm.runInNewContext(output,{exports,require:n=>n==='server-only'?{}:Object.hasOwn(mocks,n)?mocks[n]:require(n),Request,Response,URL,Date,setTimeout,clearTimeout,console});return exports;}
async function main(){let authenticated=true,calls=[],created=null;const id='00000000-0000-0000-0000-000000000001';
 const {wooJobColumns}=load('src/lib/woo-import-queue.ts',{'./supabase':{},'./woocommerce-service':{},'./woo-catalog-page':{},'./woocommerce-media':{}});
 const db={from:table=>({select(value){calls.push([table,'select',value]);return this;},eq(...args){calls.push([table,'eq',...args]);return this;},order(){return this;},limit(){return this;},async maybeSingle(){return{data:{id,status:'queued'},error:null};},async single(){return{data:{id,status:'running'},error:null};},then(resolve,reject){return Promise.resolve({data:[{id,status:'queued'}],error:null}).then(resolve,reject);}})};
 const mock={'@/lib/supabase':{supabaseAdmin:db},'@/lib/woo-import-jobs':{wooJson:(v,status=200)=>Response.json(v,{status}),wooCreator:async()=>authenticated?{store:{id:'own-store'},integration:{id:'integration',store_id:'own-store',status:'active',sync_products_from_woo:true}}:null,enqueueWooImport:async(integration,mode,ids)=>{created={integration,mode,ids};return{id};}},'@/lib/woo-import-queue':{wooJobColumns,processWooImport:async(store,job)=>{calls.push(['process',store,job]);return{busy:true};}}};
 const route=load('src/app/api/creator/woocommerce/import-jobs/route.ts',mock);
 const req=body=>new Request('https://site.test/api/creator/woocommerce/import-jobs',{method:'POST',headers:{origin:'https://site.test'},body:JSON.stringify(body)});
 authenticated=false;assert.equal((await route.GET(new Request('https://site.test/api/creator/woocommerce/import-jobs'))).status,401);authenticated=true;
 await route.GET(new Request('https://site.test/api/creator/woocommerce/import-jobs?storeId=foreign'));
 assert.ok(calls.some(call=>call.join('|')==='woocommerce_import_jobs|eq|store_id|own-store'));assert.ok(!wooJobColumns.includes('assets'));assert.ok(!wooJobColumns.includes('lease_token'));assert.ok(!wooJobColumns.includes('queue'));
 assert.equal((await route.POST(req({action:'create',mode:'selected',ids:Array.from({length:150},(_,i)=>i+1)}))).status,201);assert.equal(created.ids.length,150);
 assert.equal((await route.POST(req({action:'create',mode:'all'}))).status,201);assert.equal(created.ids.length,0);assert.equal(created.mode,'all');
 assert.equal((await route.POST(req({action:'create',mode:'selected',ids:[-1]}))).status,400);
 const step=await(await route.POST(req({action:'step',id}))).json();assert.equal(step.waitMs,5000);assert.ok(calls.some(call=>call.join('|')==='process|own-store|'+id));
 const baseJob={id,status:'completed',mode:'all',processed:501,failed:0,skipped:0,discovered:501,warnings:1,last_error:null,issues:[{product:2,stage:'image',message:'Imagem indisponível'}]};
 function render(job){const states=[job,true,false,false,'',false,[],0,false,[]];const react={...React,useState:initial=>React.useState(states.length?states.shift():initial)};const Panel=load('src/app/dashboard/woocommerce/WooImportPanel.tsx',{react,'@/lib/client-api':{},'@/lib/api-response':{}}).default;return renderToStaticMarkup(React.createElement(Panel,{enabled:true,onFinished(){}}));}
 assert.match(render(null),/Importar todo o catálogo/);assert.match(render({...baseJob,status:'paused'}),/Retomar/);const html=render(baseJob);assert.match(html,/501/);assert.match(html,/Avisos de arquivos/);assert.match(html,/Imagem indisponível/);
 console.log('PASS: private authenticated job API, own-store scoping, selection above 100, all mode without a giant ID list, lease backoff, safe public job fields and real React progress/pause/warning UI.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
