import assert from 'node:assert/strict';
import {
  getEvolutionWebhookToken,
  secureEvolutionWebhookUrl,
  verifyEvolutionWebhookToken,
} from '../src/lib/evolution-webhook-security';

const valid = {
  NODE_ENV: 'test',
  EVOLUTION_WEBHOOK_SECRET: 'webhook-secret-with-at-least-32-characters-123',
} as NodeJS.ProcessEnv;
const fallback = {
  NODE_ENV: 'test',
  SERVER_CRYPTO_SECRET: 'server-secret-with-at-least-32-characters-456',
} as NodeJS.ProcessEnv;

const token = getEvolutionWebhookToken(valid);
assert.ok(token);
assert.equal(token?.length, 64);
assert.equal(verifyEvolutionWebhookToken(token, valid), true);
assert.equal(verifyEvolutionWebhookToken(`${token}x`, valid), false);
assert.equal(verifyEvolutionWebhookToken(null, valid), false);
assert.equal(getEvolutionWebhookToken({ NODE_ENV: 'test', EVOLUTION_WEBHOOK_SECRET: 'short' } as NodeJS.ProcessEnv), null);
assert.ok(getEvolutionWebhookToken(fallback));
assert.notEqual(getEvolutionWebhookToken(valid), getEvolutionWebhookToken(fallback));

const securedUrl = secureEvolutionWebhookUrl('https://educalizando.com.br/api/webhooks/whatsapp-store?source=evolution', valid);
assert.ok(securedUrl);
const parsedUrl = new URL(securedUrl!);
assert.equal(parsedUrl.searchParams.get('source'), 'evolution');
assert.equal(parsedUrl.searchParams.get('webhook_token'), token);

console.log('Evolution webhook authentication verified.');
