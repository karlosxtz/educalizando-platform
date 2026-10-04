import 'server-only';

import { createHash, randomBytes } from 'node:crypto';

export const STORE_CHATBOT_KEY_PREFIX = 'edu_live_';

export function createStoreChatbotApiKey() {
  const secret = randomBytes(32).toString('base64url');
  const key = `${STORE_CHATBOT_KEY_PREFIX}${secret}`;
  return {
    key,
    hash: hashStoreChatbotApiKey(key),
    prefix: key.slice(0, STORE_CHATBOT_KEY_PREFIX.length + 6),
    lastFour: key.slice(-4),
  };
}

export function hashStoreChatbotApiKey(key: string) {
  return createHash('sha256').update(key).digest('hex');
}

export function readStoreChatbotApiKey(request: Request) {
  const authorization = request.headers.get('authorization') || '';
  const bearer = authorization.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  return bearer || request.headers.get('x-educalizando-api-key')?.trim() || '';
}

export function isStoreChatbotApiKey(value: string) {
  return value.startsWith(STORE_CHATBOT_KEY_PREFIX) && value.length >= 48 && value.length <= 100;
}
