const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),assert=require('node:assert/strict');
function load(file,mocks={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:key=>Object.hasOwn(mocks,key)?mocks[key]:require(key),URL,AbortSignal,Uint8Array,Error,fetch:(...args)=>request(...args)});return exports;}
const recovery=load('src/lib/platform-image-recovery.ts');
let statuses=[],requests=[],uploads=[];
async function request(url,options){requests.push([String(url),options]);const status=statuses.shift()??200;return new Response(status===200?new Uint8Array([137,80,78,71]):'unavailable',{status,headers:{'content-type':status===200?'image/png':'text/plain',...(status===302?{location:'https://127.0.0.1/private'}:{})}});}
const mediaLoad=(file,mocks)=>load(file,{...mocks,["./image-processor-client"]:{imageProcessorConfigured:()=>false}});
const media=mediaLoad('src/lib/woocommerce-media.ts',{'server-only':{},'@/lib/remote-addresses':{resolveRemoteAddresses:async()=>[{address:'203.0.113.10'}]},'@/lib/object-storage':{resolveBucket:()=> 'covers',uploadObject:async asset=>uploads.push(asset),platformPublicImageUrl:(_bucket,key)=>'https://arquivos.educalizando.com.br/public-images/'+key},'@/lib/product-image-optimizer':{optimizeProductImage:async()=>{throw Error('keep original fixture');}},'./platform-image-recovery':recovery});
(async()=>{
  const transformed='https://assets.example.test/storage/v1/render/image/public/covers/file.png?width=99999&quality=80';
  assert.equal(recovery.originalPublicImage(transformed),'https://assets.example.test/storage/v1/object/public/covers/file.png');
  assert.equal(recovery.originalPublicImage('https://assets.example.test/storage/v1/render/image/sign/covers/file.png?token=private'),null);
  assert.equal(recovery.originalPublicImage('https://assets.example.test/_next/image?url=%2Fcover.png&w=99'),'https://assets.example.test/cover.png');
  assert.equal(recovery.originalPublicImage('https://assets.example.test/_next/image?url=https%3A%2F%2Fother.example.test%2Fimage.png'),null);
  statuses=[400,200];await media.mirrorPlatformImportImage(transformed,'store','product',0);
  assert.equal(requests.length,2);assert.equal(requests[1][0],recovery.originalPublicImage(transformed));assert.equal(uploads.length,1);
  assert.deepEqual(Object.keys(requests[1][1].headers),['Accept'],'No API credential may reach an image server');
  statuses=[400];requests=[];
  await assert.rejects(()=>media.mirrorPlatformImportImage('https://assets.example.test/missing.png','store','product',1),error=>recovery.unavailablePublicImage(error)&&error.status===400);
  assert.equal(requests.length,1);assert.equal(uploads.length,1,'No placeholder or broken response uploaded');
  statuses=[503];requests=[];
  await assert.rejects(()=>media.mirrorPlatformImportImage(transformed,'store','product',2),error=>!recovery.unavailablePublicImage(error)&&error.status===503);
  assert.equal(requests.length,1,'Temporary failures must not discard an image');
  statuses=[400,302];requests=[];
  await assert.rejects(()=>media.mirrorPlatformImportImage(transformed,'store','product',3),error=>/inválido|rede privada/.test(error.message));
  assert.equal(requests.length,2,'A redirect to a private network must never be requested');
  console.log('PASS: original-image recovery, safe redirects, no credentials, unavailable images and transient errors.');
})().catch(error=>{console.error(error);process.exitCode=1;});
