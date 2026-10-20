const fs=require('node:fs'),ts=require('typescript'),vm=require('node:vm'),assert=require('node:assert/strict');
function load(file,mocks){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:key=>Object.hasOwn(mocks,key)?mocks[key]:require(key),crypto:require('node:crypto').webcrypto,URL,URLSearchParams,TextDecoder,Uint8Array,AbortSignal,Response});return exports;}
const contract=load('src/lib/saber-export-contract.ts',{'./platform-delivery-diagnostics':load('src/lib/platform-delivery-diagnostics.ts',{}),'./saber-product-price':load('src/lib/saber-product-price.ts',{}),'./product-description':load('src/lib/product-description.ts',{}),'./presentation-video':load('src/lib/presentation-video.ts',{})});
const client=load('src/lib/saber-export-client.ts',{'server-only':{},'./saber-export-contract':contract});
const item=contract.parseSaberExport({seller:{id:'origin-a'},products:[{id:'a',title:'Local test material',price:7,description:'Description from authorised export',images:['https://source.example.test/cover.png'],categories:[]}],total:1}).products[0];
const tables={platform_product_imports:[],platform_product_import_receipts:[],products:[],categories:[],education_levels:[]};
let sourcePage={owner:'origin-a',label:'Local fixture store',products:[item],total:1,nextUrl:null},mirrorCalls=0,insertFailure=null;
const db={from:table=>{
  assert(Object.hasOwn(tables,table));const where=[];let action='read',values,single=false,leasePredicate=false;
  const query={select(){return query;},eq(key,value){where.push([key,value]);return query;},is(key,value){where.push([key,value]);return query;},order(){return query;},limit(){return query;},single(){single=true;return query;},maybeSingle(){single=true;return query;},or(value){leasePredicate=value.includes('lease_until.');return query;},insert(input){action='insert';values=input;return query;},update(input){action='update';values=input;return query;},
    then(resolve){if(action==='insert' && table==='platform_product_imports' && insertFailure)return Promise.resolve({data:null,error:insertFailure}).then(resolve);let rows=tables[table].filter(row=>where.every(([key,value])=>row[key]===value)&&(!leasePredicate || !row.lease_until || Date.parse(row.lease_until)<Date.now()));
      if(action==='insert'){rows=[{...values}];if(table==='platform_product_imports')rows[0]={id:crypto.randomUUID(),cursor:0,imported:0,skipped:0,current_product:null,asset_cursor:0,issues:[],lease_token:null,lease_until:null,...rows[0]};tables[table].push(...rows);}
      if(action==='update')rows.forEach(row=>Object.assign(row,values));
      const data=single?(rows[0]||null):rows;return Promise.resolve({data:data?structuredClone(data):data,error:null}).then(resolve);
    }
  };return query;
},rpc:async(_name,args)=>{const product=tables.products.find(row=>row.id===args.p_product);assert.equal(product.store_id,args.p_store);assert.equal(product.status,'rascunho');assert(product.import_incomplete);product.capa_url=args.p_url;return {data:true,error:null};}};
const jobs=load('src/lib/saber-import-job.ts',{'server-only':{},'./supabase':{supabaseAdmin:db},'./saber-import-errors':load('src/lib/saber-import-errors.ts',{}),'./saber-export-client':{...client,readSaberExport:async()=>structuredClone(sourcePage)},'./saber-export-contract':contract,'./woocommerce-media':{mirrorPlatformImportImage:async()=>{mirrorCalls++;return 'https://arquivos.educalizando.com.br/public-images/fixture.webp';}}});
async function create(store='destination-a'){return jobs.createSaberJob(store,'fixture-token','fingerprint','origin-a');}
const current=id=>structuredClone(tables.platform_product_imports.find(row=>row.id===id));
(async()=>{
  const job=await create();await jobs.processSaberJob(current(job.id),'fixture-token');assert.equal(tables.products.length,1);assert.equal(tables.products[0].store_id,'destination-a');assert.equal(tables.products[0].status,'rascunho');assert.equal(tables.products[0].arquivo_url,undefined);
  await jobs.processSaberJob(current(job.id),'fixture-token');assert.equal(mirrorCalls,1);assert(tables.products[0].capa_url.startsWith('https://arquivos.educalizando.com.br/'));
  await jobs.processSaberJob(current(job.id),'fixture-token');assert.equal(current(job.id).imported,1);assert.equal(tables.platform_product_import_receipts.length,1);
  await jobs.processSaberJob(current(job.id),'fixture-token');assert.equal(current(job.id).status,'completed');
  tables.products[0].status='publicado';const title=tables.products[0].titulo;
  const repeat=await create();await jobs.processSaberJob(current(repeat.id),'fixture-token');assert.equal(current(repeat.id).skipped,1);assert.equal(tables.products.length,1);assert.equal(tables.products[0].titulo,title);assert.equal(mirrorCalls,1);
  const foreign=await create('destination-b');tables.products.push({id:client.saberImportId('destination-b','origin-a','a'),store_id:'other-destination',status:'rascunho',import_incomplete:true});await jobs.processSaberJob(current(foreign.id),'fixture-token');assert.equal(current(foreign.id).status,'paused');assert.match(current(foreign.id).last_error,/não será sobrescrito/i);
  sourcePage={...sourcePage,total:2,nextUrl:contract.SABER_EXPORT_URL+'?page=2'};
  const duplicate=await create('destination-c');const live=tables.platform_product_imports.find(row=>row.id===duplicate.id);live.cursor=1;await jobs.processSaberJob(current(duplicate.id),'fixture-token');assert.equal(current(duplicate.id).status,'paused');assert(current(duplicate.id).last_error.includes('repetiu produtos'));
  sourcePage={...sourcePage,nextUrl:null};const mismatch=await create('destination-d');tables.platform_product_imports.find(row=>row.id===mismatch.id).cursor=1;await jobs.processSaberJob(current(mismatch.id),'fixture-token');assert.equal(current(mismatch.id).status,'paused');assert(current(mismatch.id).last_error.includes('total informado'));
  // Existing job with a missing next URL resumes without resetting its finished items.
  sourcePage={...sourcePage,total:2,nextUrl:null};const recover=await create('destination-recover');
  const recoveryLive=tables.platform_product_imports.find(row=>row.id===recover.id);recoveryLive.cursor=1;recoveryLive.imported=1;
  sourcePage={...sourcePage,nextUrl:contract.SABER_EXPORT_URL+'?page=2&limit=1'};
  const productCount=tables.products.length;
  await jobs.processSaberJob(current(recover.id),'fixture-token');assert.equal(current(recover.id).next_url,sourcePage.nextUrl);assert.equal(current(recover.id).imported,1);assert.equal(tables.products.length,productCount);
  sourcePage={...sourcePage,products:[{...item,id:'b'}],nextUrl:null};
  await jobs.processSaberJob(current(recover.id),'fixture-token');assert.equal(current(recover.id).discovered,2);assert.equal(current(recover.id).cursor,0);assert.equal(current(recover.id).queue[0].id,'b');
  // A different page/seller cannot be used to repair the continuation.
  sourcePage={...sourcePage,products:[item],nextUrl:null};const changed=await create('destination-changed');tables.platform_product_imports.find(row=>row.id===changed.id).cursor=1;
  sourcePage={...sourcePage,owner:'different-seller',nextUrl:contract.SABER_EXPORT_URL+'?page=2'};
  await jobs.processSaberJob(current(changed.id),'fixture-token');assert.equal(current(changed.id).status,'paused');assert.match(current(changed.id).last_error,/loja de origem mudou/);
  sourcePage={...sourcePage,owner:'origin-a'};
  // Backfill old missing-price placeholders, preserving manual edits and publication.
  async function legacyPriceCase(store,override={}){
    sourcePage={owner:'origin-a',label:'Fixture',products:[{...item,price:12.9,priceKnown:true}],total:1,nextUrl:null};
    const legacy=await create(store),live=tables.platform_product_imports.find(row=>row.id===legacy.id);
    live.queue[0]={...live.queue[0],adapterVersion:undefined,price:0,priceKnown:false};live.cursor=1;live.imported=1;live.issues=[{product:item.title,message:'Preço não disponível: confirme o valor antes de publicar.'}];
    const product={id:client.saberImportId(store,'origin-a',item.id),store_id:store,status:'rascunho',import_incomplete:true,import_price_confirmed:false,preco:0,preco_original:null,is_free:false,...override};tables.products.push(product);
    tables.platform_product_import_receipts.push({store_id:store,provider:'saberdidatico',source_owner:'origin-a',source_id:item.id,product_id:product.id});
    await jobs.processSaberJob(current(legacy.id),'fixture-token');assert.equal(current(legacy.id).imported,1);assert.equal(current(legacy.id).cursor,1);return {product,job:current(legacy.id)};
  }
  let legacy=await legacyPriceCase('destination-old-price');assert.equal(legacy.product.preco,12.9);assert.equal(legacy.product.import_price_confirmed,true);assert.equal(legacy.job.issues.length,0);
  legacy=await legacyPriceCase('destination-manual-price',{preco:8});assert.equal(legacy.product.preco,8);
  legacy=await legacyPriceCase('destination-published-price',{status:'publicado'});assert.equal(legacy.product.preco,0);
  legacy=await legacyPriceCase('destination-confirmed-price',{import_price_confirmed:true});assert.equal(legacy.product.preco,0);
  sourcePage={owner:'origin-a',label:'Fixture',products:[item],total:2,nextUrl:contract.SABER_EXPORT_URL+'?page=2'};
  const finalPage=await create('destination-final-page');tables.platform_product_imports.find(row=>row.id===finalPage.id).cursor=1;
  sourcePage={...sourcePage,products:[{...item,id:'last-page-item',images:[]}],nextUrl:contract.SABER_EXPORT_URL+'?page=3',inferredNext:true};
  await jobs.processSaberJob(current(finalPage.id),'fixture-token');assert.equal(current(finalPage.id).discovered,2);assert.equal(current(finalPage.id).next_url,null);
  for(let step=0;step<4 && current(finalPage.id).status==='running';step++)await jobs.processSaberJob(current(finalPage.id),'fixture-token');assert.equal(current(finalPage.id).status,'completed');
  insertFailure={code:'42703',message:'must not leak imported payload'};await assert.rejects(()=>create(),error=>error.message.includes('seen_ids')&&!error.message.includes('must not leak'));
  insertFailure={code:'08006',message:'must not leak credentials'};await assert.rejects(()=>create(),error=>!error.message.includes('migration')&&!error.message.includes('credentials'));
  console.log('PASS Saber job: metadata-only draft creation, image step, receipts, completion, restart without duplication, reviewed-product preservation, foreign-store collision, duplicate page/total guards and accurate storage failures.');
})().catch(error=>{console.error(error);process.exitCode=1;});
