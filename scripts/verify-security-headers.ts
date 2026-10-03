import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const config = readFileSync('next.config.ts', 'utf8');
const proxy = readFileSync('src/proxy.ts', 'utf8');
const authSync = readFileSync('src/app/api/auth/sync/route.ts', 'utf8');
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
assert.match(proxy, /supabase\.auth\.getClaims\(\)/, 'Rotas protegidas devem validar o JWT sem consultar getUser em toda navegação.');
assert.match(proxy, /AUTH_CHECK_TIMEOUT_MS\s*=\s*8_000/, 'A validação da sessão deve possuir limite de tempo.');
assert.match(proxy, /reason', 'session-timeout'/, 'Páginas protegidas devem recuperar sessões que excederem o tempo limite.');
assert.doesNotMatch(proxy, /strict-dynamic|x-nonce/, 'Páginas estáticas protegidas não podem receber CSP baseado em nonce.');
assert.doesNotMatch(aiOptimize, /runtime\s*=\s*['"]edge/);
assert.doesNotMatch(downloadRoute, /supabaseAdmin\.storage|createSignedUrl|getPublicUrl/);

console.log('CSP de produção e falha segura do Supabase verificadas.');
