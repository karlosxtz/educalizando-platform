const fs=require('node:fs'),ts=require('typescript'),vm=require('node:vm'),assert=require('node:assert/strict');
function load(file,mocks){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:key=>Object.hasOwn(mocks,key)?mocks[key]:require(key),crypto:require('node:crypto').webcrypto,URL,URLSearchParams,TextDecoder,Uint8Array,AbortSignal,Response});return exports;}
const contract=load('src/lib/saber-export-contract.ts',{'./product-description':load('src/lib/product-description.ts',{}),'./presentation-video':load('src/lib/presentation-video.ts',{})});
const client=load('src/lib/saber-export-client.ts',{'server-only':{},'./saber-export-contract':contract});
const item=contract.parseSaberExport({seller:{id:'origin-a'},products:[{id:'a',title:'Local test material',price:7,description:'Description from authorised export',images:['https://source.example.test/cover.png'],categories:[]}],total:1}).products[0];
const tables={platform_product_imports:[],platform_product_import_receipts:[],products:[],categories:[],education_levels:[]};
let sourcePage={owner:'origin-a',label:'Local fixture store',products:[item],total:1,nextUrl:null},mirrorCalls=0;
const db={from:table=>{
  assert(Object.hasOwn(tables,table));const where=[];let action='read',values,single=false,leasePredicate=false;
  const query={select(){return query;},eq(key,value){where.push([key,value]);return query;},order(){return query;},limit(){return query;},single(){single=true;return query;},maybeSingle(){single=true;return query;},or(value){leasePredicate=value.includes('lease_until.');return query;},insert(input){action='insert';values=input;return query;},update(input){action='update';values=input;return query;},
    then(resolve){let rows=tables[table].filter(row=>where.every(([key,value])=>row[key]===value)&&(!leasePredicate || !row.lease_until || Date.parse(row.lease_until)<Date.now()));
      if(action==='insert'){rows=[{...values}];if(table==='platform_product_imports')rows[0]={id:crypto.randomUUID(),cursor:0,imported:0,skipped:0,current_product:null,asset_cursor:0,issues:[],lease_token:null,lease_until:null,...rows[0]};tables[table].push(...rows);}
      if(action==='update')rows.forEach(row=>Object.assign(row,values));
      const data=single?(rows[0]||null):rows;return Promise.resolve({data:data?structuredClone(data):data,error:null}).then(resolve);
    }
  };return query;
},rpc:async(_name,args)=>{const product=tables.products.find(row=>row.id===args.p_product);assert.equal(product.store_id,args.p_store);assert.equal(product.status,'rascunho');assert(product.import_incomplete);product.capa_url=args.p_url;return {data:true,error:null};}};
const jobs=load('src/lib/saber-import-job.ts',{'server-only':{},'./supabase':{supabaseAdmin:db},'./saber-export-client':{...client,readSaberExport:async()=>structuredClone(sourcePage)},'./saber-export-contract':contract,'./woocommerce-media':{mirrorPlatformImportImage:async()=>{mirrorCalls++;return 'https://arquivos.educalizando.com.br/public-images/fixture.webp';}}});
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
  console.log('PASS Saber job: metadata-only draft creation, image step, receipts, completion, restart without duplication, reviewed-product preservation, foreign-store collision, duplicate page and total mismatch pause.');
})().catch(error=>{console.error(error);process.exitCode=1;});
