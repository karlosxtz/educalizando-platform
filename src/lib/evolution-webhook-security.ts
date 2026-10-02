import { createHmac,timingSafeEqual } from 'node:crypto';
import { getConfiguredCryptoSecret } from './financial-configuration';

const WEBHOOK_TOKEN_CONTEXT = 'educalizando:evolution-webhook:v1';

function configuredSecret(source: NodeJS.ProcessEnv) {
  const dedicatedSecret = source.EVOLUTION_WEBHOOK_SECRET?.trim();
  if (dedicatedSecret) return dedicatedSecret;

  try {
    return getConfiguredCryptoSecret(source);
  } catch {
    return '';
  }
}

/**
 * Uses a scoped derivative instead of exposing the application's signing secret
 * in the webhook URL registered with Evolution.
 */
export function getEvolutionWebhookToken(source: NodeJS.ProcessEnv = process.env) {
  const secret = configuredSecret(source);
  if (secret.length < 32) return null;
  return createHmac('sha256', secret).update(WEBHOOK_TOKEN_CONTEXT).digest('hex');
}

export function secureEvolutionWebhookUrl(webhookUrl: string, source: NodeJS.ProcessEnv = process.env) {
  const token = getEvolutionWebhookToken(source);
  if (!token) return null;

  const url = new URL(webhookUrl);
  url.searchParams.set('webhook_token', token);
  return url.toString();
}

export function verifyEvolutionWebhookToken(candidate: string | null, source: NodeJS.ProcessEnv = process.env) {
  const expected = getEvolutionWebhookToken(source);
  if (!expected || !candidate) return false;

  const expectedBuffer = Buffer.from(expected, 'utf8');
  const candidateBuffer = Buffer.from(candidate, 'utf8');
  return expectedBuffer.length === candidateBuffer.length && timingSafeEqual(expectedBuffer, candidateBuffer);
}
