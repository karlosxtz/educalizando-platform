import assert from 'node:assert/strict';
import { consumeRequestRateLimit } from '../src/lib/request-rate-limit';

const request = new Request('https://educalizando.com.br/api/leads', {
  headers: { 'x-vercel-forwarded-for': '203.0.113.42' },
});
const options = { namespace: `test-${crypto.randomUUID()}`, limit: 2, windowMs: 1_000 };

assert.deepEqual(consumeRequestRateLimit(request, options, 1_000), {
  allowed: true, limit: 2, remaining: 1, retryAfterSeconds: 1,
});
assert.equal(consumeRequestRateLimit(request, options, 1_100).allowed, true);
const blocked = consumeRequestRateLimit(request, options, 1_200);
assert.equal(blocked.allowed, false);
assert.equal(blocked.remaining, 0);
assert.equal(blocked.retryAfterSeconds, 1);
assert.equal(consumeRequestRateLimit(request, options, 2_001).allowed, true);

console.log('Rate limiting de rotas públicas verificado.');
