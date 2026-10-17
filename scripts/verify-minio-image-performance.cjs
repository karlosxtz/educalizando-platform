const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, mocks = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
    { exports, require: name => mocks[name] || require(name), URL, Set });
  return exports;
}
const { imageUploadProfile } = load('src/lib/image-upload-profile.ts');
assert.equal(imageUploadProfile('product-files'), null);
assert.equal(imageUploadProfile('plr-files'), null);
assert.equal(imageUploadProfile('store-assets', 'avatar').maxWidthOrHeight, 320);
assert.equal(imageUploadProfile('main-banners').maxWidthOrHeight, 1920);
assert(imageUploadProfile('product-covers').maxSizeMB < 0.25);
const original='https://arquivos.educalizando.com.br/public-images/uploads/creator/logo.png';
const { catalogThumbnailUrl, catalogImageUrl } = load('src/lib/catalog-image-url.ts', {
  './public-links': { normalizePublicAssetUrl: value => value },
  './public-image-url': load('src/lib/public-image-url.ts'),
  './minio-preview-manifest.json': { default: { '/public-images/uploads/creator/logo.png': 'a'.repeat(32) } },
});
assert.equal(catalogImageUrl(original), original, 'Original resolver remains unchanged');
assert.equal(catalogThumbnailUrl(original), 'https://arquivos.educalizando.com.br/public-images/uploads/previews/v1/'+ 'a'.repeat(32)+'.webp');
for (const value of ['https://external.test/public-images/uploads/creator/logo.png', original+'?X-Amz-Signature=x', 'minio://private-materials/uploads/creator/logo.png', original.replace('public-images','private-plr'), original.replace('logo.png','unknown.png')]) {
  assert.equal(catalogThumbnailUrl(value), value, 'Unknown/private/external URLs must never gain a guessed preview');
}
const files = ['HomepageMarketplace','ProductCard','MarketplaceKitCard','KitCoverMosaic'].map(name => fs.readFileSync('src/components/'+name+'.tsx','utf8'));
for(const source of files) assert(!source.includes('<img '), 'Offscreen cards/logos use the shared lazy image component');
const image=fs.readFileSync('src/components/ui/CatalogImage.tsx','utf8');
assert(image.includes("loading = 'lazy'") && image.includes('fallback !== src'));
assert(!image.includes('image_retry='), 'Retry must preserve the exact original URL, no cache busting');
assert(fs.readFileSync('src/components/MainBannersCarousel.tsx','utf8').includes('thumbnail={false} loading="lazy" fetchPriority="auto"'));
const maintenance=fs.readFileSync('scripts/optimize-minio-previews.mjs','utf8');
assert(maintenance.includes('PutObjectCommand') && !maintenance.includes('DeleteObjectCommand'));
assert(maintenance.includes('const key = `uploads/previews/v1/${hash}.webp`'));
console.log('PASS MinIO: previews verificados, originais e arquivos privados preservados, cache sem busting, imagens fora da dobra lazy e compressão por finalidade.');
