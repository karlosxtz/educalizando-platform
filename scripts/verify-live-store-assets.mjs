import assert from 'node:assert/strict';
import { loadEnv } from 'vite';

const env = { ...loadEnv('production', process.cwd(), ''), ...process.env };
const site = 'https://www.educalizando.com.br';
const data = await fetch(env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/stores?select=slug,logo_url,banner_url,author_image_url&slug=eq.loja-da-pro', {
  headers: { apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY, Authorization: 'Bearer ' + env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
  signal: AbortSignal.timeout(20000),
});
assert.equal(data.status, 200, 'Read public store');
const rows = await data.json();
assert.equal(rows.length, 1, 'The affected creator store exists');
for (const field of ['logo_url', 'banner_url', 'author_image_url']) {
  const old = new URL(rows[0][field]);
  assert.equal(old.searchParams.get('bucket'), 'public-images');
  const legacy = site + '/api/storage/public-image' + old.search;
  const redirect = await fetch(legacy, { redirect: 'manual', signal: AbortSignal.timeout(20000) });
  assert.equal(redirect.status, 302, field + ': image avoids the app CPU limit');
  const target = new URL(redirect.headers.get('location'));
  assert.equal(target.origin, 'https://arquivos.educalizando.com.br');
  assert.equal(target.pathname.startsWith('/public-images/uploads/'), true);
  const image = await fetch(target, { signal: AbortSignal.timeout(20000) });
  assert.equal(image.status, 200, field + ': stored image opens');
  assert.equal(image.headers.get('content-type')?.startsWith('image/'), true);
  await image.body?.cancel();
  console.log('PASS: ' + rows[0].slug + ' / ' + field + ' / imagem pública 200');
}
console.log('PASS: os três arquivos existentes foram recuperados sem reenviar imagens.');
