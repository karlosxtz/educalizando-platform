const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),assert=require('node:assert/strict');
function load(file,mocks={},globals={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,{exports,require:name=>Object.hasOwn(mocks,name)?mocks[name]:require(name),URL,URLSearchParams,Response,Request,AbortSignal,TextDecoder,Uint8Array,console,crypto:require('node:crypto').webcrypto,...globals});return exports;}
const contract=load('src/lib/saber-export-contract.ts',{'./product-description':load('src/lib/product-description.ts'),'./presentation-video':load('src/lib/presentation-video.ts')});
const storageErrors=load('src/lib/saber-import-errors.ts');
assert.match(storageErrors.saberImportStorageMessage({code:'42703'}),/seen_ids/);
assert.match(storageErrors.saberImportStorageMessage({code:'PGRST204'}),/estrutura/);
assert.match(storageErrors.saberImportStorageMessage({code:'42P01'}),/tabelas/);
assert.match(storageErrors.saberImportStorageMessage({code:'42501'}),/permissões/);
assert.doesNotMatch(storageErrors.saberImportStorageMessage({code:'08006',message:'credential: must not leak'}),/migration|credential/);
assert.doesNotMatch(storageErrors.saberImportStorageMessage({code:'malicious-secret-code'}),/malicious-secret/);
const fixture={seller:{id:'seller-a',name:'Loja fixture'},products:[{id:'product-a',seller_id:'seller-a',name:'Material de teste local',price:'6,90',regular_price:'9,00',description:'<p>Descrição real da origem.</p><script>bad()</script>',images:[{url:'https://public.example.test/cover.webp'}],categories:[{name:'Alfabetização'}],downloads:[{url:'https://private.example.test/file.pdf'}],customers:[{email:'fixture@example.test'}]}],pagination:{current_page:1,last_page:2,total:2}};
const parsed=contract.parseSaberExport(fixture);assert.equal(parsed.owner,'seller-a');assert.equal(parsed.products[0].price,6.9);assert.equal(parsed.products[0].originalPrice,9);assert.equal(parsed.nextUrl,contract.SABER_EXPORT_URL+'?page=2&limit=1');assert(!JSON.stringify(parsed).includes('private.example'));assert(!JSON.stringify(parsed).includes('fixture@example'));assert(!parsed.products[0].description.includes('bad()'));
assert.equal(contract.parseSaberExport({...fixture,products:[{...fixture.products[0],sale_price:''}]}).products[0].price,6.9);
assert.equal(contract.parseSaberExport({...fixture,products:[{...fixture.products[0],price:undefined,regular_price:undefined}]}).products[0].priceKnown,false);
assert.throws(()=>contract.parseSaberExport({...fixture,products:[{...fixture.products[0],seller_id:'other-store'}]}),/lojas diferentes/);
assert.throws(()=>contract.parseSaberExport({...fixture,products:[fixture.products[0],fixture.products[0]]}),/repetidos/);
assert.throws(()=>contract.parseSaberExport({products:[{id:'a',name:'Sem identidade'}]}),/identificar a loja/);
assert.throws(()=>contract.parseSaberExport({html:'wrong'}),/lista de produtos/);
// Reproduce a catalogue of 281 items whose first response contains only five.
const pageFixture=(page,extra={})=>({seller:{id:'seller-a'},products:Array.from({length:Math.min(5,281-(page-1)*5)},(_,index)=>({id:'catalog-'+((page-1)*5+index),title:'Pagination fixture',price_cents:690})),total:281,...extra});
let nextCatalog=contract.SABER_EXPORT_URL,receivedIds=new Set(),pageNumber=1;
while(nextCatalog){const page=contract.parseSaberExport(pageFixture(pageNumber),nextCatalog);for(const product of page.products){assert(!receivedIds.has(product.id));receivedIds.add(product.id);assert.equal(product.price,6.9);assert(product.priceKnown);}nextCatalog=page.nextUrl;pageNumber++;assert(pageNumber<=58);}
assert.equal(receivedIds.size,281);assert.equal(pageNumber,58);
const camel=contract.parseSaberExport(pageFixture(1,{total:undefined,pagination:{currentPage:1,totalPages:57,perPage:5,totalProducts:281}}));
assert.equal(camel.total,281);assert.equal(camel.nextUrl,contract.SABER_EXPORT_URL+'?page=2&perPage=5');
const numericNext=contract.parseSaberExport(pageFixture(1,{pagination:{page:1,nextPage:2,limit:5}}));assert.equal(new URL(numericNext.nextUrl).searchParams.get('page'),'2');
const offsetPage=contract.parseSaberExport(pageFixture(1,{pagination:{offset:0,limit:5}}));assert.equal(new URL(offsetPage.nextUrl).searchParams.get('offset'),'5');
const cursorPage=contract.parseSaberExport(pageFixture(1,{nextCursor:'opaque-next',hasMore:true}));assert.equal(new URL(cursorPage.nextUrl).searchParams.get('cursor'),'opaque-next');
assert.equal(contract.parseSaberExport(pageFixture(1,{hasMore:false})).nextUrl,null);
assert.throws(()=>contract.parseSaberExport(pageFixture(1),contract.SABER_EXPORT_URL+'?cursor=opaque-current&limit=5'),/cursor/);
for(const [field,raw,price] of [['priceCents',690,6.9],['price_in_cents','1290',12.9],['priceInCents',0,0],['preco_centavos',790,7.9],['salePrice','6,90',6.9]]){
  const result=contract.parseSaberExport({...fixture,products:[{id:'price-fixture',title:'Price fixture',[field]:raw}]}).products[0];assert.equal(result.price,price);assert(result.priceKnown);
}
assert.equal(contract.parseSaberExport({...fixture,products:[{id:'invalid-cents',title:'Invalid cents fixture',price_cents:'6.90'}]}).products[0].priceKnown,false);
for(const next of ['https://evil.test/api/public/sync/seller-products','http://saberdidatico.com.br/api/public/sync/seller-products','https://saberdidatico.com.br/api/public/products','?token=secret','?seller_id=other','https://secret@saberdidatico.com.br/api/public/sync/seller-products'])assert.throws(()=>contract.saberNextUrl(next));
let network=[],networkMode='ok';
const fakeToken='sbr_live_'+'0'.repeat(64);
const client=load('src/lib/saber-export-client.ts',{'server-only':{},'./saber-export-contract':contract},{fetch:async(url,options)=>{network.push({url,options});if(networkMode==='redirect')return new Response('',{status:302,headers:{location:'https://evil.test'}});if(networkMode==='refused')return Response.json({error:fakeToken},{status:401});return Response.json(fixture);}});
assert.equal(client.saberImportId('destination-a','seller-a','product-a'),client.saberImportId('destination-a','seller-a','product-a'));assert.notEqual(client.saberImportId('destination-b','seller-a','product-a'),client.saberImportId('destination-a','seller-a','product-a'));assert.notEqual(client.saberImportId('destination-a','seller-b','product-a'),client.saberImportId('destination-a','seller-a','product-a'));
(async()=>{
  await client.readSaberExport(fakeToken);assert.equal(network[0].url,contract.SABER_EXPORT_URL);assert.equal(network[0].options.headers.Authorization,'Bearer '+fakeToken);assert.equal(network[0].options.redirect,'manual');assert(!network[0].url.includes(fakeToken));
  networkMode='redirect';await assert.rejects(()=>client.readSaberExport(fakeToken),/não foi encaminhada/);assert.equal(network.length,2);
  networkMode='refused';await assert.rejects(()=>client.readSaberExport(fakeToken),error=>!error.message.includes(fakeToken)&&error.message.includes('não autorizou'));
  const sql=fs.readFileSync('supabase/migrations/20261019050000_create_platform_product_imports.sql','utf8');assert(sql.includes('REVOKE ALL'));assert(!sql.includes('token_encrypted'));assert(!/ALTER TABLE public\.products/.test(sql));
  const guard=fs.readFileSync('supabase/migrations/20261019051000_platform_import_image_transaction.sql','utf8');assert(guard.includes("status='rascunho' AND import_incomplete=true FOR UPDATE"));assert(guard.includes('lease_token=p_lease'));assert(guard.includes('FROM PUBLIC,anon,authenticated'));
  const worker=fs.readFileSync('src/lib/saber-import-job.ts','utf8');assert(worker.includes("status:'rascunho',import_incomplete:true"));assert(!worker.includes("from('product_deliveries')"));assert(!worker.includes("from('product_delivery_files')"));assert(worker.includes('seen.has(item.id)'));assert(worker.includes('job.discovered!==job.source_total'));assert(worker.includes(".eq('store_id',job.store_id).eq('lease_token',lease)"));
  console.log('PASS Saber import: strict token destination, no redirect forwarding, response privacy, seller isolation, exact prices, metadata-only drafts, deterministic scoped IDs, duplicate-page and total guards, private state and atomic image ownership guard.');
})().catch(error=>{console.error(error);process.exitCode=1;});
