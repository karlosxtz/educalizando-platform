const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const exportsForTest={},env={IMAGE_PROCESSOR_URL:'https://images.example.test',IMAGE_PROCESSOR_SECRET:'local-test-secret-'.repeat(3)};
let request,result={url:'https://arquivos.educalizando.com.br/public-images/uploads/optimized/v1/platform/store-1/product-1/0-'+ 'a'.repeat(24)+'/full.webp',size:1234},status=200;
result.thumbnail=result.url.replace('/full.webp','/thumb.webp');
const code=ts.transpileModule(fs.readFileSync('src/lib/image-processor-client.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
class RemoteImageHttpError extends Error{constructor(status){super('source error');this.status=status;}}
vm.runInNewContext(code,{exports:exportsForTest,process:{env},URL,Error,AbortSignal,Date,fetch:async(url,options)=>{request={url:String(url),...options};return Response.json(result,{status});},require:name=>name==='server-only'?{}:name==='./platform-image-recovery'?{RemoteImageHttpError}:require(name)});
(async()=>{
  assert(exportsForTest.imageProcessorConfigured());
  const image=await exportsForTest.processRemoteImage('https://source.example.test/public.png','platform','store-1','product-1',0);
  assert.equal(image.size,1234);assert.equal(request.url,'https://images.example.test/v1/import-image');
  assert.equal(JSON.parse(request.body).source,'https://source.example.test/public.png');
  assert.equal(request.headers['X-Image-Signature'],crypto.createHmac('sha256',env.IMAGE_PROCESSOR_SECRET).update(request.headers['X-Image-Timestamp']+'.'+request.body).digest('hex'));
  assert(!request.headers.Authorization);assert.equal(request.redirect,'error');
  result={...result,url:result.url.replace('/store-1/','/other-store/')};
  await assert.rejects(()=>exportsForTest.processRemoteImage('https://source.example.test/public.png','platform','store-1','product-1',0),/desta loja/);
  status=422;result={sourceStatus:400};
  await assert.rejects(()=>exportsForTest.processRemoteImage('https://source.example.test/public.png','platform','store-1','product-1',0),error=>error.status===400);
  status=503;result={error:'private credential must not leak'};
  await assert.rejects(()=>exportsForTest.processRemoteImage('https://source.example.test/public.png','platform','store-1','product-1',0),error=>!error.message.includes('private credential'));
  console.log('PASS processor client: metadata only, signed requests, no redirected credentials, tenant-bound result and safe source errors.');
})().catch(error=>{console.error(error);process.exitCode=1;});
