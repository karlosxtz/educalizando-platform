const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript'), assert = require('node:assert/strict');
function load(path, dependencies = {}, extra = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports, require: key => { if (!(key in dependencies)) throw new Error('Unexpected dependency: ' + key); return dependencies[key]; }, URL, Response, Uint8Array, TextDecoder, AbortSignal, ...extra });
  return exports;
}
const contract = load('src/lib/instagram-community.ts');
const { instagramCommunityHandle: handle, instagramCommunityPhoto: photo, instagramCommunityCount: count } = contract;
assert.equal(handle('@Minha_Loja'), 'minha_loja');
assert.equal(handle('https://www.instagram.com/minha.loja/?igsh=abc'), 'minha.loja');
for (const bad of ['https://evil.test/user', 'https://instagram.com.evil.test/user', 'https://instagram.com@evil.test/user', 'https://www.instagram.com/reel/abc/', 'https://www.instagram.com/accounts/', 'javascript:alert(1)', 'a..b', 'a'.repeat(31)]) assert.equal(handle(bad), null, bad);
assert.equal(photo('https://scontent.cdninstagram.com/photo.jpg'), 'https://scontent.cdninstagram.com/photo.jpg');
assert.equal(photo('https://cdninstagram.com.evil.test/photo.jpg'), null);
assert.equal(photo('https://evil.test/token?secret=abc'), null);
assert.equal(count(0), 0); assert.equal(count('100'), null); assert.equal(count(-1), null);
const publicStore = { id: 'public-store', nome_loja: 'Fixture', slug: 'fixture', instagram: '@fixture', creator_id: 'must-not-leak', email: 'must-not-leak' };
assert(!JSON.stringify(contract.instagramCommunityCard(publicStore)).includes('must-not-leak'));
let current = 'creator-a', graphCalls = 0, decryptCalls = 0, reads = 0, directoryReads = 0;
let enabled = true, connection = { instagram_user_id: '123', username: 'fixture', token_encrypted: 'encrypted-secret', expires_at: '2099-01-01T00:00:00.000Z' };
const db = { from(table) { assert.equal(table, 'creator_instagram_connections'); return { select(columns) { assert(!columns.includes('*')); return { eq(key, id) { assert.equal(key, 'store_id'); assert.equal(id, publicStore.id); return { async maybeSingle() { reads++; return { data: connection, error: null }; } }; } }; } }; } };
function serverInstance() {
  return load('src/lib/instagram-community-server.ts', {
    'server-only': {}, './instagram-community': contract,
    './supabase': { supabase: { from(table) { assert.equal(table, 'stores'); directoryReads++; const query = { select(columns) { assert(!columns.includes('creator_id')); assert(!columns.includes('email')); return query; }, not() { return query; }, neq() { return query; }, order() { return query; }, async range() { return { data: [publicStore], error: null }; } }; return query; } }, supabaseAdmin: db },
    './sitemap-pagination': { collectSitemapRows: async read => (await read(0, 999)).data },
    './instagram-security': { instagramConfig: () => enabled ? { version: 'v24.0' } : null, decryptInstagramToken(encrypted, storeId) { assert.equal(encrypted, 'encrypted-secret'); assert.equal(storeId, publicStore.id); decryptCalls++; return 'private-token'; } },
  }, { fetch: async (url, options) => { graphCalls++; assert.equal(url.hostname, 'graph.instagram.com'); assert(!url.href.includes('private-token')); assert.equal(options.headers.Authorization, 'Bearer private-token'); assert.equal(options.redirect, 'manual'); return Response.json({ username: 'fixture', followers_count: 0, media_count: 12, profile_picture_url: 'https://scontent.cdninstagram.com/photo.jpg', token: 'private-token', unexpected: 'private-field' }); } });
}
(async () => {
  const server = serverInstance(), card = contract.instagramCommunityCard(publicStore);
  const directory = await server.readInstagramCommunity(); await server.readInstagramCommunity();
  assert.equal(directory.length, 1); assert.equal(directoryReads, 1);
  enabled = false; assert.equal((await server.readInstagramCommunityProfile(card)).available, false); assert.equal(reads, 0);
  enabled = true;
  let result = await server.readInstagramCommunityProfile(card);
  assert.equal(result.followers, 0); assert.equal(result.mediaCount, 12); assert.equal(graphCalls, 1);
  assert(!JSON.stringify(result).includes('private-token')); assert(!JSON.stringify(result).includes('private-field'));
  await server.readInstagramCommunityProfile(card); assert.equal(graphCalls, 1);
  connection = { ...connection, username: 'private-other-account' };
  result = await serverInstance().readInstagramCommunityProfile(card); assert.equal(result.available, false); assert.equal(decryptCalls, 1);
  connection = { ...connection, username: 'fixture', expires_at: '2000-01-01T00:00:00.000Z' };
  result = await serverInstance().readInstagramCommunityProfile(card); assert.equal(result.available, false); assert.equal(graphCalls, 1);
  const api = load('src/app/api/creator/instagram-community/route.ts', {
    '@/lib/instagram-community': contract,
    '@/lib/instagram-security': { instagramConfig: () => null },
    '@/lib/instagram-store': { instagramContext: async () => { if (!current) throw new Error('unauthorized'); return { store: { id: publicStore.id } }; }, instagramJson: (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } }), instagramFailure: () => Response.json({ error: 'Entre com sua conta' }, { status: 401 }) },
    '@/lib/instagram-community-server': { readInstagramCommunity: async () => [card], readInstagramCommunityProfile: async input => { assert.equal(input.id, publicStore.id); return { available: true, followers: 0 }; } },
    '@/lib/supabase': { supabaseAdmin: db }, '@/lib/request-rate-limit': { consumeRequestRateLimit: async () => ({ allowed: true }) },
  });
  current = null; assert.equal((await api.GET(new Request('https://www.educalizando.com.br/api/creator/instagram-community'))).status, 401);
  current = 'creator-a';
  let listing = await api.GET(new Request('https://www.educalizando.com.br/api/creator/instagram-community'));
  const listingBody = await listing.json(); assert.equal(listingBody.statisticsEnabled, false); assert(!JSON.stringify(listingBody).includes('encrypted-secret'));
  let response = await api.GET(new Request('https://www.educalizando.com.br/api/creator/instagram-community?profile=private-store'));
  assert.equal(response.status, 404);
  response = await api.GET(new Request('https://www.educalizando.com.br/api/creator/instagram-community?profile=public-store'));
  assert.equal(response.headers.get('cache-control'), 'private, no-store'); assert.equal((await response.json()).profile.followers, 0);
  console.log('PASS Instagram community: strict profile/CDN URLs, public DTO, auth, private-account guard, Meta gate, expiry, no token in responses, zero followers preserved, bounded cached graph reads.');
})().catch(error => { console.error(error); process.exitCode = 1; });
