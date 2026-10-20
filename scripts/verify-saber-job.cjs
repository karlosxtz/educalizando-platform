const fs=require('node:fs'),ts=require('typescript'),vm=require('node:vm'),assert=require('node:assert/strict');
function load(file,mocks){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:key=>Object.hasOwn(mocks,key)?mocks[key]:require(key),crypto:require('node:crypto').webcrypto,URL,URLSearchParams,TextDecoder,Uint8Array,AbortSignal,Response,Error});return exports;}
const contract=load('src/lib/saber-export-contract.ts',{'./platform-delivery-contract':load('src/lib/platform-delivery-contract.ts',{}),'./platform-delivery-diagnostics':load('src/lib/platform-delivery-diagnostics.ts',{}),'./saber-product-price':load('src/lib/saber-product-price.ts',{}),'./product-description':load('src/lib/product-description.ts',{}),'./presentation-video':load('src/lib/presentation-video.ts',{})});
const client=load('src/lib/saber-export-client.ts',{'server-only':{},'./saber-export-contract':contract});
const item=contract.parseSaberExport({seller:{id:'origin-a'},products:[{id:'a',title:'Local test material',price:7,description:'Description from authorised export',images:['https://source.example.test/cover.png'],categories:[]}],total:1}).products[0];
let sourceReader=null;
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
const jobs=load('src/lib/saber-import-job.ts',{'server-only':{},'./supabase':{supabaseAdmin:db},'./saber-import-errors':load('src/lib/saber-import-errors.ts',{}),'./saber-export-client':{...client,readSaberExport:async(_token,url)=>structuredClone(sourceReader?sourceReader(url):sourcePage)},'./saber-export-contract':contract,'./platform-delivery-resume':{importedDeliveryPresent:async(_db,_store,product,_id,index)=>delivered.has(product+':'+index)},'./platform-delivery-media':{mirrorPlatformDelivery:async(file,store,product,index)=>{fileDownloads++;if(mirrorFailure)throw Error('A entrega não pôde ser baixada.');return ({url:`minio://private-materials/platform-imports/${store}/${product}/deliveries/${index}-fixture.pdf`,name:file.name,size:20,mimeType:'application/pdf',external:file.url.includes('drive.google.com')});}},'./woocommerce-media':{mirrorPlatformImportImage:async()=>{mirrorCalls++;return 'https://arquivos.educalizando.com.br/public-images/fixture.webp';}}});
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
  sourcePage={...sourcePage,nextUrl:null};const mismatch=await create('destination-d');tables.platform_product_imports.find(row=>row.id===mismatch.id).cursor=1;for(let i=0;i<7&&current(mismatch.id).status==='running';i++)await jobs.processSaberJob(current(mismatch.id),'fixture-token');assert.equal(current(mismatch.id).status,'paused');assert(current(mismatch.id).last_error.includes('total informado'));
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
  // Partially overlapping pages must preserve unique counts and import every new item.
  const plain={...item,images:[],deliveries:[]};
  sourcePage={owner:'origin-a',label:'Fixture',products:[{...plain,id:'overlap-a'}],total:3,nextUrl:contract.SABER_EXPORT_URL+'?page=2'};
  const overlapJob=await create('destination-overlapping-pages');
  for(let i=0;i<2;i++)await jobs.processSaberJob(current(overlapJob.id),'fixture-token');
  sourcePage={...sourcePage,products:[{...plain,id:'overlap-a'},{...plain,id:'overlap-b'}],nextUrl:contract.SABER_EXPORT_URL+'?page=3'};
  await jobs.processSaberJob(current(overlapJob.id),'fixture-token');
  assert.equal(current(overlapJob.id).status,'running');assert.equal(current(overlapJob.id).discovered,2);
  assert.deepEqual(current(overlapJob.id).queue.map(product=>product.id),['overlap-b']);
  assert(current(overlapJob.id).issues.some(issue=>issue.message.includes('repetido(s)')));
  for(let i=0;i<2;i++)await jobs.processSaberJob(current(overlapJob.id),'fixture-token');
  sourcePage={...sourcePage,products:[{...plain,id:'overlap-b'},{...plain,id:'overlap-c'}],nextUrl:null};
  await jobs.processSaberJob(current(overlapJob.id),'fixture-token');
  for(let i=0;i<4&&current(overlapJob.id).status==='running';i++)await jobs.processSaberJob(current(overlapJob.id),'fixture-token');
  assert.equal(current(overlapJob.id).status,'completed');assert.equal(current(overlapJob.id).discovered,3);assert.equal(current(overlapJob.id).imported,3);
  assert.equal(tables.products.filter(product=>product.store_id==='destination-overlapping-pages').length,3);
  assert.equal(new Set(current(overlapJob.id).seen_ids).size,3);
  // One duplicate-only page with a genuinely new continuation can be crossed safely.
  async function repeatedPageJob(store){
    sourcePage={owner:'origin-a',label:'Fixture',products:[{...plain,id:'repeated-a'}],total:2,nextUrl:contract.SABER_EXPORT_URL+'?page=2'};
    const job=await create(store);for(let i=0;i<2;i++)await jobs.processSaberJob(current(job.id),'fixture-token');
    sourcePage={...sourcePage,nextUrl:contract.SABER_EXPORT_URL+'?page=3'};
    await jobs.processSaberJob(current(job.id),'fixture-token');
    assert.equal(current(job.id).status,'running');assert.equal(current(job.id).queue.length,0);assert.equal(current(job.id).discovered,1);return job;
  }
  const repeatedForward=await repeatedPageJob('destination-duplicate-page-forward');
  sourcePage={...sourcePage,products:[{...plain,id:'repeated-b'}],nextUrl:null};
  await jobs.processSaberJob(current(repeatedForward.id),'fixture-token');
  for(let i=0;i<4&&current(repeatedForward.id).status==='running';i++)await jobs.processSaberJob(current(repeatedForward.id),'fixture-token');
  assert.equal(current(repeatedForward.id).status,'completed');assert.equal(current(repeatedForward.id).imported,2);
  const stuck=await repeatedPageJob('destination-duplicate-page-loop');
  sourcePage={...sourcePage,nextUrl:contract.SABER_EXPORT_URL+'?page=4'};
  await jobs.processSaberJob(current(stuck.id),'fixture-token');
  assert.equal(current(stuck.id).status,'paused');assert.match(current(stuck.id).last_error,/sem avançar/);assert.equal(current(stuck.id).discovered,1);
  // A duplicate last page must not hide missing products behind a successful completion.
  const missingAfterDuplicates=await repeatedPageJob('destination-duplicate-missing-total');
  sourcePage={...sourcePage,nextUrl:null};
  await jobs.processSaberJob(current(missingAfterDuplicates.id),'fixture-token');
  await jobs.processSaberJob(current(missingAfterDuplicates.id),'fixture-token');
  for(let i=0;i<8&&current(missingAfterDuplicates.id).status==='running';i++)await jobs.processSaberJob(current(missingAfterDuplicates.id),'fixture-token');
  assert.equal(current(missingAfterDuplicates.id).status,'paused');assert.match(current(missingAfterDuplicates.id).last_error,/total informado/);
  sourcePage={owner:'origin-a',label:'Fixture',products:[{...item,deliveries:[{name:'Material.pdf',url:'https://files.example.org/material.pdf'}]}],total:1,nextUrl:null};
  // A growing catalogue starts one fresh pass, including a product inserted at the front.
  const growingA={...plain,id:'growing-a',deliveries:[{name:'Material.pdf',url:'https://files.example.org/growing.pdf'}]};
  const growingB={...plain,id:'growing-b'},growingC={...plain,id:'growing-c'},growingNew={...plain,id:'new-at-front'};
  let catalogueChanged=false,rootReads=0;
  sourceReader=url=>{
    const page=Number(new URL(url || contract.SABER_EXPORT_URL).searchParams.get('page') || 1);
    if(page===1)rootReads++;
    return {owner:'origin-a',label:'Fixture',total:catalogueChanged?4:3,products:page===1?(catalogueChanged?[growingNew,growingA]:[growingA]):page===2?[growingB]:[growingC],nextUrl:page<3?contract.SABER_EXPORT_URL+'?page='+(page+1):null};
  };
  const growingJob=await create('destination-growing');
  for(let step=0;step<6;step++)await jobs.processSaberJob(current(growingJob.id),'fixture-token');
  assert.equal(current(growingJob.id).imported,2);const downloadsBeforeGrowth=fileDownloads;
  catalogueChanged=true;
  await jobs.processSaberJob(current(growingJob.id),'fixture-token');
  assert.equal(current(growingJob.id).status,'running');assert.equal(current(growingJob.id).source_total,4);assert.equal(current(growingJob.id).discovered,2);
  assert.equal(current(growingJob.id).visited_urls.filter(url=>url===contract.SABER_EXPORT_URL).length,2);
  assert(current(growingJob.id).issues.some(issue=>issue.message.includes('nova conferência')));
  for(let step=0;step<20&&current(growingJob.id).status==='running';step++)await jobs.processSaberJob(current(growingJob.id),'fixture-token');
  assert.equal(current(growingJob.id).status,'completed');assert.equal(current(growingJob.id).discovered,4);
  assert.equal(current(growingJob.id).imported,2);assert.equal(current(growingJob.id).skipped,2);assert.equal(rootReads,2);
  assert.equal(fileDownloads,downloadsBeforeGrowth,'Rechecking must not download committed files again');
  assert.equal(tables.products.filter(product=>product.store_id==='destination-growing').length,4);
  // Removal at the source also requires a fresh view, without deleting local materials.
  let shrunk=false;
  sourceReader=url=>({owner:'origin-a',label:'Fixture',total:shrunk?1:3,products:shrunk?[{...plain,id:'keep-a'}]:[{...plain,id:'keep-a'},{...plain,id:'removed-at-source'}],nextUrl:shrunk?null:contract.SABER_EXPORT_URL+'?page=2'});
  const shrinkingJob=await create('destination-shrinking');
  for(let step=0;step<4;step++)await jobs.processSaberJob(current(shrinkingJob.id),'fixture-token');
  const savedBeforeShrink=structuredClone(tables.products.filter(product=>product.store_id==='destination-shrinking'));shrunk=true;
  await jobs.processSaberJob(current(shrinkingJob.id),'fixture-token');
  for(let step=0;step<5&&current(shrinkingJob.id).status==='running';step++)await jobs.processSaberJob(current(shrinkingJob.id),'fixture-token');
  assert.equal(current(shrinkingJob.id).status,'completed');assert.equal(current(shrinkingJob.id).source_total,1);assert.equal(current(shrinkingJob.id).discovered,1);
  assert.deepEqual(structuredClone(tables.products.filter(product=>product.store_id==='destination-shrinking')),savedBeforeShrink);
  // Repeated catalogue changes are bounded; no false completion or retry loop.
  let changingTotal=2;
  sourceReader=url=>({owner:'origin-a',label:'Fixture',total:changingTotal,products:[{...plain,id:'unstable-a'}],nextUrl:contract.SABER_EXPORT_URL+'?page=2'});
  const unstable=await create('destination-unstable');
  for(let step=0;step<2;step++)await jobs.processSaberJob(current(unstable.id),'fixture-token');
  changingTotal=3;await jobs.processSaberJob(current(unstable.id),'fixture-token');
  await jobs.processSaberJob(current(unstable.id),'fixture-token');
  changingTotal=4;await jobs.processSaberJob(current(unstable.id),'fixture-token');
  assert.equal(current(unstable.id).status,'paused');assert.match(current(unstable.id).last_error,/ainda está mudando/);
  assert.equal(current(unstable.id).visited_urls.filter(url=>url===contract.SABER_EXPORT_URL).length,2);
  sourceReader=null;
  migrationReady=false;await assert.rejects(()=>create('destination-missing-migration'),/Ative/);
  console.log('PASS file import: sequential private deliveries, external-link notice, repeat/backfill without duplicate products, reviewed preservation, download failure and manual-delivery conflict pause, missing migration gate.');
  console.log('PASS Saber job: metadata-only draft creation, image step, receipts, completion, restart without duplication, reviewed-product preservation, foreign-store collision, duplicate page/total guards and accurate storage failures.');
})().catch(error=>{console.error(error);process.exitCode=1;});
