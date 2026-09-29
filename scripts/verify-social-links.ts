import assert from 'node:assert/strict';
import { normalizeExternalUrl, normalizeStoreSocialLinks } from '../src/lib/social-links';

assert.equal(normalizeExternalUrl('@educalizando', 'instagram'), 'https://www.instagram.com/educalizando');
assert.equal(normalizeExternalUrl('educalizando', 'tiktok'), 'https://www.tiktok.com/@educalizando');
assert.equal(normalizeExternalUrl('@educalizando', 'youtube'), 'https://www.youtube.com/@educalizando');
assert.equal(normalizeExternalUrl('educalizando', 'facebook'), 'https://www.facebook.com/educalizando');
assert.equal(normalizeExternalUrl('educalizando.com.br/contato', 'website'), 'https://educalizando.com.br/contato');
assert.equal(
  normalizeExternalUrl('https://www.instagram.com/educalizando/?hl=pt-br', 'instagram'),
  'https://www.instagram.com/educalizando/?hl=pt-br',
);
assert.equal(normalizeExternalUrl('javascript:alert(1)', 'instagram'), null);
assert.equal(normalizeExternalUrl('/pagina-interna', 'website'), null);

const store = normalizeStoreSocialLinks({
  instagram: '@loja',
  youtube: 'youtube.com/@loja',
  tiktok: null,
  facebook: '',
  website: 'www.loja.com.br',
  nome_loja: 'Loja de teste',
});

assert.equal(store.instagram, 'https://www.instagram.com/loja');
assert.equal(store.youtube, 'https://youtube.com/@loja');
assert.equal(store.tiktok, null);
assert.equal(store.facebook, null);
assert.equal(store.website, 'https://www.loja.com.br/');
assert.equal(store.nome_loja, 'Loja de teste');

console.log('Links sociais validados para Instagram, YouTube, TikTok, Facebook e site.');
