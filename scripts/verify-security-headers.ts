import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const config = readFileSync('next.config.ts', 'utf8');
const proxy = readFileSync('src/proxy.ts', 'utf8');
const authSync = readFileSync('src/app/api/auth/sync/route.ts', 'utf8');
const protectedProxy = readFileSync('src/proxy.ts', 'utf8');
const aiOptimize = readFileSync('src/app/api/ai/optimize/route.ts', 'utf8');
const downloadRoute = readFileSync('src/app/api/aluno/materiais/[productId]/download/route.ts', 'utf8');

assert.match(config, /object-src 'none'/);
assert.match(config, /base-uri 'self'/);
assert.match(config, /frame-ancestors 'self'/);
assert.match(config, /NODE_ENV === 'development'/);
assert.equal(config.match(/unsafe-eval/g)?.length, 1, 'unsafe-eval deve existir somente na exceção de desenvolvimento.');
assert.match(config, /script-src 'self' 'unsafe-inline'\$\{developmentScriptPolicy\}/);
assert.doesNotMatch(proxy, /xyzcompany|\|\| 'dummy'/);
assert.doesNotMatch(authSync, /xyzcompany|\|\| 'dummy'/);
assert.match(proxy, /status: 503/);
assert.match(protectedProxy, /'nonce-\$\{nonce\}' 'strict-dynamic'/);
assert.match(protectedProxy, /requestHeaders\.set\('x-nonce', nonce\)/);
assert.doesNotMatch(aiOptimize, /runtime\s*=\s*['"]edge/);
assert.doesNotMatch(downloadRoute, /supabaseAdmin\.storage|createSignedUrl|getPublicUrl/);

console.log('CSP de produção e falha segura do Supabase verificadas.');
