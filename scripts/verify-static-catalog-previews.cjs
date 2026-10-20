const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),assert=require('node:assert/strict'),crypto=require('node:crypto'),sharp=require('sharp');
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
  let bytes=0;
  for(const [url,hash] of Object.entries(manifest)){
    const parsed=new URL(url);
    assert.equal(parsed.protocol,'https:');assert(!parsed.search&&!parsed.hash&&!parsed.username&&!parsed.password);
    assert(parsed.hostname==='arquivos.educalizando.com.br'&&parsed.pathname.startsWith('/public-images/uploads/')||parsed.hostname.endsWith('.supabase.co')&&/^\/storage\/v1\/object\/public\/(product-covers|store-assets|product-previews)\//.test(parsed.pathname));
    assert(/^[a-f0-9]{32}$/.test(hash));
    const data=fs.readFileSync('public/images/catalog-previews/'+hash+'.webp');
    assert.equal(crypto.createHash('sha256').update(data).digest('hex').slice(0,32),hash);
    const image=await sharp(data).metadata();assert.equal(image.format,'webp');assert(image.width<=640&&image.height<=640);bytes+=data.length;
  }
  const {catalogThumbnailUrl,catalogImageUrl}=exportsForTest;
  for(const url of [source,supabase]){assert.equal(catalogThumbnailUrl(url),'https://www.educalizando.com.br/images/catalog-previews/'+hash+'.webp');assert.equal(catalogImageUrl(url),url,'Full-resolution URL preserved');}
  for(const url of [source+'?token=private','minio://private-materials/fixture.pdf','https://external.test/image.png',source.replace('fixture','unknown')])assert.equal(catalogThumbnailUrl(url),url,'No private or unverified image mapping');
  assert(fs.readFileSync('public/_headers','utf8').includes('/images/catalog-previews/*\n  Cache-Control: public, max-age=31536000, immutable'));
  console.log(JSON.stringify({result:'PASS static CDN previews: public-only manifest, real decodable assets, content hashes, originals preserved, immutable cache',mapped:Object.keys(manifest).length,bytes}));
})().catch(error=>{console.error(error);process.exitCode=1;});
