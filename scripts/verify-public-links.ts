import assert from 'node:assert/strict';
import { publicSiteOrigin, publicStoreUrl, normalizePublicAssetUrl } from '../src/lib/public-links';
import { normalizeStoreSocialLinks } from '../src/lib/social-links';
import { publicImageObjectUrl, publicImageRedirect } from '../src/lib/public-image-url';

const site = 'https://www.educalizando.com.br';
for (const bad of ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://0.0.0.0:3000', 'https://unrelated.example', '', 'not a url']) {
  assert.equal(publicSiteOrigin(bad, 'production'), site);
}
assert.equal(publicSiteOrigin('http://localhost:3000', 'development'), 'http://localhost:3000');
assert.equal(publicStoreUrl('loja-da-pro'), site + '/loja/loja-da-pro');
assert.equal(publicStoreUrl('name/../../admin'), site + '/loja/name%2F..%2F..%2Fadmin');
const query = '?bucket=public-images&key=uploads%2Fcreator%2Flogo.webp';
for (const host of ['localhost:3000', '127.0.0.1:3000', '0.0.0.0:3000', '[::1]:3000', 'educalizando.com.br']) {
  assert.equal(normalizePublicAssetUrl('http://' + host + '/api/storage/public-image' + query), 'https://arquivos.educalizando.com.br/public-images/uploads/creator/logo.webp');
}
assert.equal(normalizePublicAssetUrl('/api/storage/public-image' + query), 'https://arquivos.educalizando.com.br/public-images/uploads/creator/logo.webp');
assert.equal(normalizePublicAssetUrl('http://localhost:9000/public-images/uploads/avatar.webp'), 'https://arquivos.educalizando.com.br/public-images/uploads/avatar.webp');
assert.equal(normalizePublicAssetUrl('minio://private-materials/uploads/file.pdf'), 'minio://private-materials/uploads/file.pdf');
assert.equal(normalizePublicAssetUrl('https://cdn.example.com/logo.webp'), 'https://cdn.example.com/logo.webp');
assert.equal(normalizePublicAssetUrl('https://localhost.example.com/api/storage/public-image' + query), 'https://localhost.example.com/api/storage/public-image' + query);
assert.equal(normalizePublicAssetUrl(null), null);
for (const [bucket, key] of [
  ['private-materials', 'uploads/file.png'], ['private-plr', 'uploads/file.webp'],
  ['public-images', 'uploads/../secret.png'], ['public-images', 'uploads/./logo.webp'],
  ['public-images', 'uploads//logo.webp'], ['public-images', 'uploads/creator\\logo.webp'],
  ['public-images', 'uploads/file.html'], ['public-images', 'secret/logo.png'],
]) assert.equal(publicImageObjectUrl(bucket, key), null);
assert.equal(publicImageObjectUrl('public-images', 'uploads/creator/my photo.webp'), 'https://arquivos.educalizando.com.br/public-images/uploads/creator/my%20photo.webp');
const legacy = new Request(site + '/api/storage/public-image' + query);
const redirected = publicImageRedirect(legacy);
assert.equal(redirected?.status, 302);
assert.equal(redirected?.headers.get('Location'), 'https://arquivos.educalizando.com.br/public-images/uploads/creator/logo.webp');
assert.equal(publicImageRedirect(new Request(legacy, { method: 'HEAD' }))?.status, 302);
assert.equal(publicImageRedirect(new Request(legacy, { method: 'POST' })), null);
assert.equal(publicImageRedirect(new Request(site + '/api/storage/public-media' + query)), null);
assert.equal(publicImageRedirect(new Request(site + '/api/storage/public-image?bucket=private-materials&key=uploads/file.png')), null);
const store = { nome_loja: 'Minha loja', logo_url: 'http://localhost:3000/api/storage/public-image' + query, banner_url: 'http://127.0.0.1:3000/api/storage/public-image' + query, author_image_url: 'http://localhost:3000/api/storage/public-image' + query, instagram: '@minha.loja' };
const fixed = normalizeStoreSocialLinks(store);
assert.equal(fixed.logo_url, 'https://arquivos.educalizando.com.br/public-images/uploads/creator/logo.webp');
assert.equal(fixed.banner_url, 'https://arquivos.educalizando.com.br/public-images/uploads/creator/logo.webp');
assert.equal(fixed.author_image_url, 'https://arquivos.educalizando.com.br/public-images/uploads/creator/logo.webp');
assert.equal(store.logo_url.startsWith('http://localhost'), true, 'Do not mutate the read source');
assert.deepEqual(normalizeStoreSocialLinks({ instagram: '@perfil' }), { instagram: 'https://www.instagram.com/perfil' }, 'Missing image fields must not be cleared');
console.log('PASS: lojas no domínio oficial, imagens antigas corrigidas, origem de produção protegida e arquivos privados preservados.');

