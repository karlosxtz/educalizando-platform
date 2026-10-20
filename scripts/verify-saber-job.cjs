const fs=require('node:fs'),ts=require('typescript'),vm=require('node:vm'),assert=require('node:assert/strict');
function load(file,mocks){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:key=>Object.hasOwn(mocks,key)?mocks[key]:require(key),crypto:require('node:crypto').webcrypto,URL,URLSearchParams,TextDecoder,Uint8Array,AbortSignal,Response,Error});return exports;}
const contract=load('src/lib/saber-export-contract.ts',{'./platform-delivery-contract':load('src/lib/platform-delivery-contract.ts',{}),'./platform-delivery-diagnostics':load('src/lib/platform-delivery-diagnostics.ts',{}),'./saber-product-price':load('src/lib/saber-product-price.ts',{}),'./product-description':load('src/lib/product-description.ts',{}),'./presentation-video':load('src/lib/presentation-video.ts',{})});
const client=load('src/lib/saber-export-client.ts',{'server-only':{},'./saber-export-contract':contract});
const item=contract.parseSaberExport({seller:{id:'origin-a'},products:[{id:'a',title:'Local test material',price:7,description:'Description from authorised export',images:['https://source.example.test/cover.png'],categories:[]}],total:1}).products[0];
let fileDownloads=0,deliveryCalls=0,deliveryAllowed=true,migrationReady=true,mirrorFailure=false;const delivered=new Map();
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
},rpc:async(_name,args)=>{if(args.p_probe)return {data:migrationReady,error:null};if(_name==='apply_platform_import_delivery'){deliveryCalls++;const product=tables.products.find(row=>row.id===args.p_product);assert.equal(product.store_id,args.p_store);assert.equal(product.status,'rascunho');if(!deliveryAllowed)return {data:false,error:null};delivered.set(args.p_product+':'+args.p_index,args.p_asset);return {data:true,error:null};}const product=tables.products.find(row=>row.id===args.p_product);assert.equal(product.store_id,args.p_store);assert.equal(product.status,'rascunho');assert(product.import_incomplete);product.capa_url=args.p_url;return {data:true,error:null};}};
const jobs=load('src/lib/saber-import-job.ts',{'server-only':{},'./supabase':{supabaseAdmin:db},'./saber-import-errors':load('src/lib/saber-import-errors.ts',{}),'./saber-export-client':{...client,readSaberExport:async()=>structuredClone(sourcePage)},'./saber-export-contract':contract,'./platform-delivery-resume':{importedDeliveryPresent:async(_db,_store,product,_id,index)=>delivered.has(product+':'+index)},'./platform-delivery-media':{mirrorPlatformDelivery:async(file,store,product,index)=>{fileDownloads++;if(mirrorFailure)throw Error('A entrega não pôde ser baixada.');return ({url:`minio://private-materials/platform-imports/${store}/${product}/deliveries/${index}-fixture.pdf`,name:file.name,size:20,mimeType:'application/pdf',external:file.url.includes('drive.google.com')});}},'./woocommerce-media':{mirrorPlatformImportImage:async()=>{mirrorCalls++;return 'https://arquivos.educalizando.com.br/public-images/fixture.webp';}}});
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
  insertFailure=null;
  sourcePage={owner:'origin-a',label:'Fixture',products:[{...item,id:'with-files',images:[],deliveries:[{name:'Material.pdf',url:'https://files.example.org/material.pdf'},{name:'Pasta de apoio',url:'https://drive.google.com/drive/folders/test'}]}],total:1,nextUrl:null};
  const withFiles=await create('destination-files');
  for(let step=0;step<6&&current(withFiles.id).status==='running';step++)await jobs.processSaberJob(current(withFiles.id),'fixture-token');
  assert.equal(current(withFiles.id).status,'completed');assert.equal(current(withFiles.id).imported,1);assert.equal(deliveryCalls,2);assert.equal(delivered.size,2);
  assert(current(withFiles.id).issues.some(issue=>issue.message.startsWith('Link de entrega')));
  const countBefore=tables.products.length;
  const backfill=await create('destination-files');
  for(let step=0;step<7&&current(backfill.id).status==='running';step++)await jobs.processSaberJob(current(backfill.id),'fixture-token');
  assert.equal(current(backfill.id).status,'completed');assert.equal(current(backfill.id).skipped,1);assert.equal(tables.products.length,countBefore);assert.equal(delivered.size,2);assert.equal(deliveryCalls,2,'Already committed files are not written again');assert.equal(fileDownloads,2,'Already committed files are not downloaded again');
  const savedProduct=tables.products.find(row=>row.store_id==='destination-files');savedProduct.status='publicado';const callsBefore=deliveryCalls;
  const reviewedFiles=await create('destination-files');await jobs.processSaberJob(current(reviewedFiles.id),'fixture-token');assert.equal(deliveryCalls,callsBefore);assert.equal(current(reviewedFiles.id).skipped,1);
  mirrorFailure=true;const failedFile=await create('destination-failed-file');await jobs.processSaberJob(current(failedFile.id),'fixture-token');await jobs.processSaberJob(current(failedFile.id),'fixture-token');
  assert.equal(current(failedFile.id).status,'paused');assert.equal(current(failedFile.id).imported,0);assert.match(current(failedFile.id).last_error,/entrega/);mirrorFailure=false;
  deliveryAllowed=false;const manual=await create('destination-manual-file');await jobs.processSaberJob(current(manual.id),'fixture-token');await jobs.processSaberJob(current(manual.id),'fixture-token');assert.equal(current(manual.id).status,'paused');assert.equal(current(manual.id).imported,0);deliveryAllowed=true;
  const beforeRestart=tables.products.length;
  await jobs.restartSaberDeliveries(current(failedFile.id),'fixture-token');assert.equal(current(failedFile.id).status,'running');assert.equal(current(failedFile.id).cursor,0);assert.equal(tables.products.length,beforeRestart);
  await assert.rejects(()=>jobs.restartSaberDeliveries(current(failedFile.id),'fixture-token'),/pausada/);
  // A draft edited before its completion receipt must not block the next item.
  sourcePage={owner:'origin-a',label:'Fixture',products:[{...item,id:'edited-before-receipt',images:[],deliveries:[{name:'Original.pdf',url:'https://files.example.org/original.pdf'}]},{...item,id:'next-after-edited',images:[],deliveries:[]}],total:2,nextUrl:null};
  const editedJob=await create('destination-edited-during-import');
  await jobs.processSaberJob(current(editedJob.id),'fixture-token');
  const editedProduct=tables.products.find(row=>row.store_id==='destination-edited-during-import');
  editedProduct.status='publicado';editedProduct.import_incomplete=false;editedProduct.titulo='Título definido pelo criador';
  const editedSnapshot=structuredClone(editedProduct), downloadsBefore=fileDownloads;
  assert(!tables.platform_product_import_receipts.some(row=>row.product_id===editedProduct.id));
  await jobs.processSaberJob(current(editedJob.id),'fixture-token');
  assert.equal(current(editedJob.id).status,'running');assert.equal(current(editedJob.id).cursor,1);assert.equal(current(editedJob.id).skipped,1);
  assert.equal(current(editedJob.id).current_product,null);assert.equal(current(editedJob.id).asset_cursor,0);assert.equal(current(editedJob.id).last_error,null);
  assert(current(editedJob.id).issues.some(issue=>issue.message.includes('preservado sem sobrescrever')));
  assert.deepEqual(structuredClone(editedProduct),editedSnapshot);assert.equal(fileDownloads,downloadsBefore);
  for(let step=0;step<5&&current(editedJob.id).status==='running';step++)await jobs.processSaberJob(current(editedJob.id),'fixture-token');
  assert.equal(current(editedJob.id).status,'completed');assert.equal(current(editedJob.id).imported,1);assert.equal(current(editedJob.id).skipped,1);
  assert.equal(tables.products.filter(row=>row.store_id==='destination-edited-during-import').length,2);
  assert.deepEqual(structuredClone(editedProduct),editedSnapshot);
  // The same protection applies to a reviewed draft, even without a receipt.
  sourcePage={...sourcePage,products:[{...item,id:'reviewed-draft',images:[]}],total:1};
  const reviewedDraftJob=await create('destination-reviewed-draft');
  await jobs.processSaberJob(current(reviewedDraftJob.id),'fixture-token');
  const reviewedDraft=tables.products.find(row=>row.store_id==='destination-reviewed-draft');reviewedDraft.import_incomplete=false;
  const reviewedSnapshot=structuredClone(reviewedDraft);
  await jobs.processSaberJob(current(reviewedDraftJob.id),'fixture-token');
  assert.equal(current(reviewedDraftJob.id).status,'running');assert.equal(current(reviewedDraftJob.id).skipped,1);assert.deepEqual(structuredClone(reviewedDraft),reviewedSnapshot);
  sourcePage={...sourcePage,products:[{...item,deliveries:[{name:'Material.pdf',url:'https://files.example.org/material.pdf'}]}]};
  migrationReady=false;await assert.rejects(()=>create('destination-missing-migration'),/Ative/);
  console.log('PASS file import: sequential private deliveries, external-link notice, repeat/backfill without duplicate products, reviewed preservation, download failure and manual-delivery conflict pause, missing migration gate.');
  console.log('PASS Saber job: metadata-only draft creation, image step, receipts, completion, restart without duplication, reviewed-product preservation, foreign-store collision, duplicate page/total guards and accurate storage failures.');
})().catch(error=>{console.error(error);process.exitCode=1;});
