import 'server-only';
import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { SITE_URL } from './seo';

export const INSTAGRAM_CALLBACK = SITE_URL + '/api/creator/instagram/callback';
export const INSTAGRAM_STATE_COOKIE = '__Host-educalizando-instagram-state';
export const INSTAGRAM_SCOPES = ['instagram_business_basic', 'instagram_business_content_publish'];
export function instagramConfig() {
  if (process.env.INSTAGRAM_PUBLISHING_ENABLED !== 'true') return null;
  const id = process.env.INSTAGRAM_APP_ID?.trim();
  const secret = process.env.INSTAGRAM_APP_SECRET?.trim();
  const version = process.env.INSTAGRAM_GRAPH_API_VERSION?.trim();
  const key = process.env.INSTAGRAM_TOKEN_ENCRYPTION_KEY?.trim();
  if (!id || !/^\d+$/.test(id) || !secret || !version || !/^v\d+\.\d+$/.test(version) || !key || Buffer.from(key, 'base64').length !== 32) return null;
  return { id, secret, version, key: Buffer.from(key, 'base64') };
}
export function newInstagramState() { return randomBytes(32).toString('base64url'); }
export function instagramStateHash(state: string) { return createHash('sha256').update(state).digest('hex'); }
export function validInstagramState(state: string | null, cookie: string | undefined) {
  return !!state && !!cookie && /^[A-Za-z0-9_-]{43}$/.test(state) && /^[A-Za-z0-9_-]{43}$/.test(cookie) && timingSafeEqual(Buffer.from(state), Buffer.from(cookie));
}
export function instagramAuthorizationUrl(state: string) {
  const config = instagramConfig(); if (!config) throw new Error('Instagram ainda não ativado na plataforma.');
  const url = new URL('https://www.instagram.com/oauth/authorize');
  url.search = new URLSearchParams({ client_id: config.id, redirect_uri: INSTAGRAM_CALLBACK, response_type: 'code', scope: INSTAGRAM_SCOPES.join(','), state, enable_fb_login: '0', force_authentication: '1' }).toString();
  return url.href;
}
export function encryptInstagramToken(token: string, storeId: string) {
  const config = instagramConfig(); if (!config) throw new Error('Instagram não configurado.');
  const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', config.key, iv);
  cipher.setAAD(Buffer.from('instagram:' + storeId));
  const data = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map(value => value.toString('base64url')).join('.');
}
export function decryptInstagramToken(value: string, storeId: string) {
  const config = instagramConfig(); if (!config) throw new Error('Instagram não configurado.');
  const [iv, tag, data] = value.split('.').map(part => Buffer.from(part, 'base64url'));
  const cipher = createDecipheriv('aes-256-gcm', config.key, iv);
  cipher.setAAD(Buffer.from('instagram:' + storeId)); cipher.setAuthTag(tag);
  return Buffer.concat([cipher.update(data), cipher.final()]).toString('utf8');
}
