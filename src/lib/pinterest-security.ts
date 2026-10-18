import 'server-only';
import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { SITE_URL } from './seo';
import { PINTEREST_SCOPES } from './pinterest-contract';
export const PINTEREST_CALLBACK = SITE_URL + '/api/creator/pinterest/callback';
export const PINTEREST_COOKIE = '__Host-educalizando-pinterest-state';
export function pinterestConfig() {
  const id = process.env.PINTEREST_APP_ID?.trim(), secret = process.env.PINTEREST_APP_SECRET?.trim(), key = process.env.PINTEREST_TOKEN_ENCRYPTION_KEY?.trim();
  if (process.env.PINTEREST_ENABLED !== 'true' || !id || !/^\d+$/.test(id) || !secret || !key || Buffer.from(key, 'base64').length !== 32) return null;
  return { id, secret, key: Buffer.from(key, 'base64'), sandbox: process.env.PINTEREST_SANDBOX !== 'false' };
}
export const newPinterestState = () => randomBytes(32).toString('base64url');
export const pinterestStateHash = (state: string) => createHash('sha256').update(state).digest('hex');
export function validPinterestState(state: string | null, cookie?: string) {
  return !!state && !!cookie && /^[A-Za-z0-9_-]{43}$/.test(state) && /^[A-Za-z0-9_-]{43}$/.test(cookie) && timingSafeEqual(Buffer.from(state), Buffer.from(cookie));
}
export function pinterestAuthorizationUrl(state: string) {
  const config = pinterestConfig(); if (!config) throw new Error('Pinterest não ativado.');
  return 'https://www.pinterest.com/oauth/?' + new URLSearchParams({ client_id: config.id, redirect_uri: PINTEREST_CALLBACK, response_type: 'code', scope: PINTEREST_SCOPES.join(','), state });
}
export function encryptPinterest(value: string, storeId: string) {
  const config = pinterestConfig(); if (!config) throw new Error('Pinterest não ativado.');
  const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', config.key, iv);
  cipher.setAAD(Buffer.from('pinterest:' + storeId));
  const data = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map(part => part.toString('base64url')).join('.');
}
export function decryptPinterest(value: string, storeId: string) {
  const config = pinterestConfig(); if (!config) throw new Error('Pinterest não ativado.');
  const [iv, tag, data] = value.split('.').map(part => Buffer.from(part, 'base64url'));
  const cipher = createDecipheriv('aes-256-gcm', config.key, iv); cipher.setAAD(Buffer.from('pinterest:' + storeId)); cipher.setAuthTag(tag);
  return Buffer.concat([cipher.update(data), cipher.final()]).toString('utf8');
}
