const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, mocks = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText,
    { exports, require: name => mocks[name] || require(name), URL, Set });
  return exports;
}
const { imageUploadProfile } = load('src/lib/image-upload-profile.ts');
const publishedManifest = JSON.parse(fs.readFileSync('src/lib/minio-preview-manifest.json','utf8'));
for (const [path, hash] of Object.entries(publishedManifest)) {
  assert(path.startsWith('/public-images/uploads/') && !path.includes('?') && !path.includes('/../'));
  assert(/^[a-f0-9]{32}$/.test(hash));
}
assert.equal(imageUploadProfile('product-files'), null);
assert.equal(imageUploadProfile('plr-files'), null);
assert.equal(imageUploadProfile('store-assets', 'avatar').maxWidthOrHeight, 256);
assert.equal(imageUploadProfile('main-banners').maxWidthOrHeight, 1920);
assert(imageUploadProfile('product-covers').maxSizeMB < 0.25);
const original='https://arquivos.educalizando.com.br/public-images/uploads/creator/logo.png';
const { catalogThumbnailUrl, catalogImageUrl } = load('src/lib/catalog-image-url.ts', {
  './public-links': { normalizePublicAssetUrl: value => value },
  './public-image-url': load('src/lib/public-image-url.ts'),
  './minio-preview-manifest.json': { __esModule: true, default: { '/public-images/uploads/creator/logo.png': 'a'.repeat(32) } },
  './catalog-preview-manifest.json': { __esModule: true, default: {} },
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
for (const theme of ['ThemeDefault','ThemeMinimalist','ThemeNetflix','ThemePinterest','ThemeLinkTree']) {
  const source=fs.readFileSync(`src/app/loja/[slug]/themes/${theme}.tsx`,'utf8');
  assert(source.includes('thumbnail={false} src={imageUrl}'), 'Full-size galleries preserve the original');
  assert(source.includes('thumbnail={false} loading="eager" fetchPriority="high" src={store.banner_url}'), 'Store hero remains full-size and prioritized');
}
const maintenance=fs.readFileSync('scripts/optimize-minio-previews.mjs','utf8');
assert(maintenance.includes('PutObjectCommand') && !maintenance.includes('DeleteObjectCommand'));
assert(maintenance.includes('const key = `uploads/previews/v1/${hash}.webp`'));
console.log('PASS MinIO: previews verificados, originais e arquivos privados preservados, cache sem busting, imagens fora da dobra lazy e compressão por finalidade.');

const React = require('react');
let imageState = [false, false], imageCursor = 0;
const CatalogImage = load('src/components/ui/CatalogImage.tsx', {
  react: { ...React, useState(initial) { const index = imageCursor++; if (imageState[index] === undefined) imageState[index] = initial; return [imageState[index], value => { imageState[index] = value; }]; } },
  'next/image': { __esModule: true, default: props => React.createElement('img', props) },
  '@/lib/catalog-image-url': { catalogImageUrl: value => value, catalogThumbnailUrl: () => 'https://arquivos.educalizando.com.br/public-images/verified-preview.webp' },
}).default;
const imageProps = { src: original, alt: 'Capa real', loading: 'eager' };
function imageAttempt() {
  imageCursor = 0;
  const root = CatalogImage(imageProps);
  return root.type(root.props);
}
let attempt = imageAttempt();
assert.equal(attempt.props.src, 'https://arquivos.educalizando.com.br/public-images/verified-preview.webp');
assert.equal(attempt.props.loading, 'eager');
attempt.props.onError();
attempt = imageAttempt();
assert.equal(attempt.props.src, original, 'Failed previews must fall back to the exact original');
attempt.props.onError();
attempt = imageAttempt();
assert.equal(attempt.type, 'div');
assert.equal(attempt.props.role, 'img', 'A failed original must render an accessible state instead of a broken image');
console.log('PASS shared image fallback: eager priority retained, exact original retry, accessible final state without a loop.');
