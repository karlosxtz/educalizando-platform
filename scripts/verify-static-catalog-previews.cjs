const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),assert=require('node:assert/strict');
const manifest=JSON.parse(fs.readFileSync('src/lib/catalog-preview-manifest.json','utf8'));
const source='https://arquivos.educalizando.com.br/public-images/uploads/fixture.png';
const supabase='https://project.supabase.co/storage/v1/object/public/product-covers/fixture.webp';
const hash='a'.repeat(32),exportsForTest={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/catalog-image-url.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,{exports:exportsForTest,URL,require:name=>({
  './public-links':{normalizePublicAssetUrl:value=>value},'./public-image-url':{publicImageObjectUrl:(_bucket,key)=>'https://arquivos.educalizando.com.br/public-images/'+key},
  './minio-preview-manifest.json':{},'./catalog-preview-manifest.json':{[source]:hash,[supabase]:hash},
})[name]});
(async()=>{
  assert(Object.keys(manifest).length>0,'Release must include generated assets');
  for(const [url,hash] of Object.entries(manifest)){
    const parsed=new URL(url);
    assert.equal(parsed.protocol,'https:');assert(!parsed.search&&!parsed.hash&&!parsed.username&&!parsed.password);
    assert(parsed.hostname==='arquivos.educalizando.com.br'&&parsed.pathname.startsWith('/public-images/uploads/')||parsed.hostname.endsWith('.supabase.co')&&/^\/storage\/v1\/object\/public\/(product-covers|store-assets|product-previews)\//.test(parsed.pathname));
    assert(/^[a-f0-9]{32}$/.test(hash));
  }
  const {catalogThumbnailUrl,catalogImageUrl}=exportsForTest;
  for(const url of [source,supabase]){assert.equal(catalogThumbnailUrl(url),'https://arquivos.educalizando.com.br/public-images/uploads/previews/v1/'+hash+'.webp');assert.equal(catalogImageUrl(url),url,'Full-resolution URL preserved');}
  for(const url of [source+'?token=private','minio://private-materials/fixture.pdf','https://external.test/image.png',source.replace('fixture','unknown')])assert.equal(catalogThumbnailUrl(url),url,'No private or unverified image mapping');
  const optimized='https://arquivos.educalizando.com.br/public-images/uploads/optimized/v1/platform/store-1/product-1/0-'+ 'a'.repeat(24)+'/full.webp';
  assert.equal(catalogThumbnailUrl(optimized),optimized.replace('/full.webp','/thumb.webp'));
  assert.equal(catalogThumbnailUrl(optimized+'?signature=private'),optimized+'?signature=private');
  assert(!fs.existsSync('public/images/catalog-previews'),'No catalogue image binaries in the Cloudflare assets');
  assert(!fs.readFileSync('public/_headers','utf8').includes('/images/catalog-previews/*'));
  console.log(JSON.stringify({result:'PASS MinIO-only previews: public manifest, direct MinIO URLs, automatic VPS thumbnails, originals preserved, no Cloudflare image assets',mapped:Object.keys(manifest).length}));
})().catch(error=>{console.error(error);process.exitCode=1;});
