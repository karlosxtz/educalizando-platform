const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, mocks, globals = {}) {
 const exports={};
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,{exports,require:name=>mocks[name]||require(name),console:{log(){},warn(){},error(){}},Response,Request,URL,Error,Set,...globals});return exports;
}
const rows=new Map(), pending=[], fileActions=[];let failDelivery=false, failFiles=false, fileWrites=0, lastDeliveryWrite=null;
const store='11111111-1111-4111-8111-111111111111';
const id='22222222-2222-4222-8222-222222222222';
const db={from(table){
 const query={filters:{},eq(key,value){this.filters[key]=value;return this;},select(){return this;},maybeSingle:async function(){return {data:table==='stores'?{id:store,creator_id:'creator'}:table==='product_deliveries'?{arquivo_url:payload.arquivo_url}: [...rows.values()].find(row=>row.id===this.filters.id&&(!this.filters.store_id||row.store_id===this.filters.store_id))||null};},
 update(input){this.updates=input;return this;},single:async function(){const row={...rows.get(this.filters.id),...this.updates};rows.set(row.id,row);return{data:row};},
 delete(){return this;},gte:async()=>{fileActions.push('delete');return{error:null};},
 insert(input){if(table!=='products')return Promise.resolve({error:null});const row=Array.isArray(input)?input[0]:input;return{select(){return this;},single:async()=>{if(rows.has(row.id))return{error:{code:'23505',message:'duplicate'}};const saved={...row,id:row.id||id};rows.set(saved.id,saved);return{data:saved,error:null};}};},
 upsert:async input=>{if(table==='product_deliveries'){if(!failDelivery)lastDeliveryWrite=input;return{error:failDelivery?new Error('delivery failure'):null};}if(table==='product_delivery_files'){fileWrites++;fileActions.push('write');return{error:failFiles?new Error('file failure'):null};}return{error:null};}
 };return query;
}};
const delivery=load('src/lib/product-delivery-files.ts',{});
const mocks={
 '@/lib/public-cache-invalidation':{invalidatePublicCatalog:async()=>true},
 '@/lib/api-auth':{getRequestUser:async()=>({id:'creator'})},'@/lib/supabase':{supabaseAdmin:db},
 'next/server':{NextResponse:Response,after:fn=>pending.push(fn)},'next/cache':{revalidatePath(){}},
 '@/lib/woocommerce-service':{syncSavedProductToWoo:async()=>{throw new Error('External sync unavailable');}},
 '@/lib/product-delivery-files':delivery,
 '@/lib/product-update-payload':load('src/lib/product-update-payload.ts',{}),
 '@/lib/product-relations-write':load('src/lib/product-relations-write.ts',{}),
 './helpers':{isValidUUID:value=>/^[0-9a-f-]{36}$/i.test(value||''),isValidProductPrice:()=>true,isValidAffiliateRate:()=>true,
 PRODUCT_TYPES:new Set(['pdf']),PRODUCT_STATUSES:new Set(['publicado']),sanitizeUUIDList:()=>[],sanitizeUUID:x=>x,normalizeInstagramVideoUrl:()=>null,normalizePreviewUrl:()=>null,uniqueProductSlug:async()=> 'teste'},
};
const route=load('src/app/api/produtos/post.ts',mocks);
const payload={store_id:store,titulo:'Teste de cadastro',tipo:'pdf',preco:9,status:'publicado',color_mode:'colorido',arquivo_url:'minio://private-materials/uploads/test.pdf',creation_request_id:id};
async function submit(){return route.POST(new Request('https://www.educalizando.com.br/api/produtos',{method:'POST',body:JSON.stringify(payload)}));}
(async()=>{
 failDelivery=true;
 const failed=await submit();assert.equal(failed.status,500);assert.equal((await failed.json()).product_id,id);assert.equal(rows.size,1);
 assert.equal(rows.get(id).status,'rascunho','Incomplete deliveries must not be publicly purchasable');
 failDelivery=false;
 for(let i=0;i<2;i++){const result=await submit();assert.equal(result.status,200);assert.equal((await result.json()).product.id,id);}
 assert.equal(rows.get(id).status,'publicado','Only complete deliveries can be published');
 assert.equal(rows.size,1,'Retries resume the original product');assert.equal(fileWrites,2);
 const recovery=load('src/lib/product-save-recovery.ts',{});
 assert.equal(recovery.completedProductSave(rows.get(id),payload,[{delivery_type:'original',file_url:payload.arquivo_url}]),true);
 assert.equal(recovery.completedProductSave(rows.get(id),payload,[]),false,'A product without its delivery cannot be reported as saved');
 assert.equal(recovery.completedProductSave({...rows.get(id),store_id:'foreign'},payload,[{delivery_type:'original',file_url:payload.arquivo_url}]),false);
 assert.equal(recovery.completedProductSave(rows.get(id),{...payload,plr_license_url:'minio://private-plr/uploads/license.zip'},[{delivery_type:'original',file_url:payload.arquivo_url}]),false,'PLR delivery must also be complete');
 for(const task of pending)await task();
 const pure=load('src/lib/product-create-request.ts',{});const cache=new Map();let generated=0;
 const storage={getItem:key=>cache.get(key)||null,setItem:(key,value)=>cache.set(key,value)};
 const newId=()=>{generated++;return id;};
 assert.equal(pure.productCreationRequest(payload,storage,newId),id);assert.equal(pure.productCreationRequest(payload,storage,newId),id);assert.equal(generated,1);
 pure.clearCreationRequest({removeItem:key=>cache.delete(key)});
 const blocked={getItem(){throw new Error('blocked');},setItem(){throw new Error('blocked');}};
 assert.equal(pure.productCreationRequest(payload,blocked,newId),id);assert.equal(pure.productCreationRequest(payload,blocked,newId),id);assert.equal(generated,2,'Storage denial must retain in-memory retry protection');
 const put=load('src/app/api/produtos/put.ts',mocks);
 const update=()=>put.PUT(new Request('https://www.educalizando.com.br/api/produtos',{method:'PUT',body:JSON.stringify({id,updates:{delivery_files:[{url:payload.arquivo_url,name:'test.pdf'}]}})}));
 fileActions.length=0;
 assert.equal((await update()).status,200);assert.deepEqual(fileActions,['write','delete']);
 const invalidUpdate=updates=>put.PUT(new Request('https://www.educalizando.com.br/api/produtos',{method:'PUT',body:JSON.stringify({id,updates})}));
 assert.equal((await invalidUpdate(null)).status,400);
 assert.equal((await put.PUT(new Request('https://www.educalizando.com.br/api/produtos',{method:'PUT',body:'invalid-json'}))).status,400);
 assert.equal((await route.POST(new Request('https://www.educalizando.com.br/api/produtos',{method:'POST',body:'invalid-json'}))).status,400);
 fileActions.length=0;assert.equal((await invalidUpdate({delivery_files:{url:'wrong'}})).status,400);assert.deepEqual(fileActions,[]);
 assert.equal((await invalidUpdate({delivery_files:[]})).status,400,'Published products cannot discard their final delivery');
 // Exact wizard payload: link mode sends [] to clear previous uploads alongside the replacement URL.
 const link='https://drive.google.com/file/d/material/view';
 rows.set(id,{...rows.get(id),status:'rascunho'});
 const linkResult=await invalidUpdate({status:'publicado',arquivo_url:link,arquivo_nome:'Material por link',delivery_files:[]});
 assert.equal(linkResult.status,200);assert.equal((await linkResult.json()).product.arquivo_url,link);
 assert.equal(rows.get(id).status,'publicado','Drafts with valid link delivery publish only after storage succeeds');
 assert.equal(lastDeliveryWrite.arquivo_url,link,'External link must reach private delivery storage');
 assert.equal(lastDeliveryWrite.arquivo_nome,'Material por link');assert.equal(rows.get(id).has_original_delivery,true);
 const plrLink='https://drive.google.com/file/d/licenca/view';
 const plrResult=await invalidUpdate({is_plr:true,preco_plr:29,arquivo_url:link,delivery_files:[],plr_license_url:plrLink,plr_delivery_files:[]});
 assert.equal(plrResult.status,200);assert.equal((await plrResult.json()).product.plr_license_url,plrLink);
 assert.equal(lastDeliveryWrite.plr_license_url,plrLink);assert.equal(rows.get(id).has_plr_delivery,true);
 assert.equal((await invalidUpdate({is_plr:false,arquivo_url:null,delivery_files:[]})).status,400,'Explicit removal still cannot publish without delivery');
 assert.equal((await invalidUpdate({is_plr:true,preco_plr:29,plr_license_url:null,plr_delivery_files:[]})).status,400,'Missing PLR delivery is still rejected');
 rows.set(id,{...rows.get(id),is_plr:false});
 const uploadResult=await invalidUpdate({arquivo_url:link,delivery_files:[{url:payload.arquivo_url,name:'Substituto.pdf'}]});
 assert.equal(uploadResult.status,200);assert.equal(lastDeliveryWrite.arquivo_url,payload.arquivo_url,'Selected upload takes precedence over old link');
 assert.equal(delivery.normalizeDeliveryFiles([{url:payload.arquivo_url}])[0].name,'Arquivo 1','Accepted unnamed files are not silently dropped');
 const filtered=mocks['@/lib/product-update-payload'].editableProductUpdates({titulo:'Valid',id:'foreign',created_at:'fake',excluido_em:'fake',sales_count:1000,has_plr_delivery:true});
 assert.deepEqual(Object.keys(filtered),['titulo'],'Read-only fields never reach privileged writes');
 fileActions.length=0;failFiles=true;
 assert.equal((await update()).status,500);assert.deepEqual(fileActions,['write'],'Never delete previous deliveries if replacement fails');failFiles=false;
 rows.set(id,{...rows.get(id),status:'rascunho'});failFiles=true;
 const publish=()=>invalidUpdate({status:'publicado',delivery_files:[{url:payload.arquivo_url,name:'test.pdf'}]});
 assert.equal((await publish()).status,500);assert.equal(rows.get(id).status,'rascunho','An edit must not publish before its delivery writes succeed');
 failFiles=false;assert.equal((await publish()).status,200);assert.equal(rows.get(id).status,'publicado');
 const saved=rows.get(id);rows.set(id,{...saved,store_id:'foreign-store'});
 assert.equal((await submit()).status,500);assert.equal(rows.get(id).store_id,'foreign-store','Idempotency cannot overwrite another store');
 let complete=true;
 const browserStorage={...storage,removeItem:key=>cache.delete(key)};
 pure.clearCreationRequest(browserStorage);
 const browserDb={auth:{getSession:async()=>({data:{session:{access_token:'test'}}})},from(table){const q={select(){return this;},eq(){return this;},maybeSingle:async()=>({data:complete?saved:null}),then(resolve){return Promise.resolve({data:complete?[{delivery_type:'original',file_url:payload.arquivo_url}]:[]}).then(resolve);}};return q;}};
 const write=load('src/lib/product-write-service.ts',{'./supabase':{supabase:browserDb},'./product-create-request':pure,'./api-response':load('src/lib/api-response.ts',{}),'./product-save-recovery':recovery,'./string-utils':{generateSlug:()=> 'test'},'./product-local-storage':{removeDeletedProductId(){},getLocalProducts:()=>[],saveLocalProducts(){throw new Error('quota');}}},
 {sessionStorage:browserStorage,crypto:{randomUUID:()=>id},fetch:async()=>{throw new TypeError('connection reset');}});
 assert.equal((await write.createProduct(payload)).id,id,'A lost response is recoverable only after verifying the private deliveries');
 assert.equal(cache.size,0,'Local cache quota cannot invalidate a confirmed save');
 complete=false;await assert.rejects(write.createProduct(payload),/interrompida/);assert.ok(cache.size>0,'Unconfirmed saves keep their ID for retry');
 mocks['@/lib/api-auth'].getRequestUser=async()=>null;
 const fullRoute=load('src/app/api/produtos/route.ts',{...mocks,'./post':route,'./put':put,'@/lib/product-deletion-policy':{}});
 for(const [method,handler] of [['GET',fullRoute.GET],['POST',route.POST],['PUT',put.PUT],['DELETE',fullRoute.DELETE]]) {
   assert.equal((await handler(new Request('https://www.educalizando.com.br/api/produtos',{method}))).status,401,'Product handlers must reject unauthenticated requests independently of the proxy');
 }
 console.log('PASS: partial-save recovery, repeated submission without duplicate products, private delivery upsert, external sync failures do not break success, store isolation.');
})().catch(e=>{console.error(e);process.exitCode=1;});
