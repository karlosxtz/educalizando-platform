import 'server-only';
import { INSTAGRAM_CALLBACK, instagramConfig } from './instagram-security';
import type { InstagramTarget } from './instagram-contract';

export class InstagramProviderError extends Error {
  stage?: 'short_token' | 'long_token' | 'profile' | 'profile_validation';
  httpStatus?: number;
  constructor(public code: number | null, public uncertain = false) {
    super(code === 190 ? 'A conexão com o Instagram expirou. Conecte a conta novamente.' : code === 4 || code === 32 || code === 613 ? 'O Instagram limitou as solicitações. Aguarde antes de tentar novamente.' : 'O Instagram não concluiu a operação. Confira a conexão e as condições da conta.');
  }
}
async function request(url: URL | string, init: RequestInit = {}): Promise<Record<string, unknown>> {
  let response: Response;
  try { response = await fetch(url, { ...init, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(12000) }); }
  catch { throw new InstagramProviderError(null, true); }
  const body = await response.json().catch(() => null);
  if (!response.ok || !body || body.error) {
    const error = new InstagramProviderError(typeof body?.error?.code === 'number' ? body.error.code : null);
    error.httpStatus = response.status; throw error;
  }
  return body;
}
function graph(path: string) {
  const config = instagramConfig(); if (!config) throw new Error('Instagram ainda não configurado.');
  if (!/^(?:me|[0-9]+)(?:\/(?:media|media_publish))?$/.test(path)) throw new Error('Recurso inválido.');
  return new URL(`https://graph.instagram.com/${config.version}/${path}`);
}
function singleInstagramResult(body: Record<string, unknown>): Record<string, unknown> {
  const value = Array.isArray(body.data) ? body.data.length === 1 ? body.data[0] : null : body;
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new InstagramProviderError(null);
  return value as Record<string, unknown>;
}
export async function exchangeInstagramCode(code: string) {
  const config = instagramConfig(); if (!config) throw new Error('Instagram ainda não configurado.');
  let stage: InstagramProviderError['stage'] = 'short_token';
  try {
  const form = new FormData();
  for (const [key, value] of Object.entries({ client_id: config.id, client_secret: config.secret, grant_type: 'authorization_code', redirect_uri: INSTAGRAM_CALLBACK, code })) form.set(key, value);
  const response = await request('https://api.instagram.com/oauth/access_token', { method: 'POST', body: form });
  // Current Instagram Login wraps credentials in data; retain the flat legacy response.
  const short = singleInstagramResult(response);
  if (typeof short.access_token !== 'string') throw new InstagramProviderError(null);
  stage = 'long_token';
  const url = new URL('https://graph.instagram.com/access_token');
  url.search = new URLSearchParams({ grant_type: 'ig_exchange_token', client_secret: config.secret, access_token: short.access_token }).toString();
  const long = await request(url);
  if (typeof long.access_token !== 'string' || typeof long.expires_in !== 'number' || long.expires_in <= 0) throw new InstagramProviderError(null);
  stage = 'profile';
  const profileUrl = graph('me'); profileUrl.searchParams.set('fields', 'user_id,username,account_type');
  const profile = singleInstagramResult(await request(profileUrl, { headers: { Authorization: 'Bearer ' + long.access_token } }));
  stage = 'profile_validation';
  const idValue = profile.user_id || short.user_id;
  const userId = typeof idValue === 'string' || typeof idValue === 'number' && Number.isSafeInteger(idValue) ? String(idValue) : '';
  const accountType = String(profile.account_type).toUpperCase();
  if (!/^\d+$/.test(userId) || typeof profile.username !== 'string' || !['BUSINESS', 'CREATOR', 'MEDIA_CREATOR'].includes(accountType)) throw new InstagramProviderError(null);
  return { token: long.access_token, expiresAt: new Date(Date.now() + long.expires_in * 1000).toISOString(), userId, username: profile.username, accountType };
  } catch (error) { if (error instanceof InstagramProviderError) error.stage = stage; throw error; }
}
export async function refreshInstagramToken(token: string) {
  const url = new URL('https://graph.instagram.com/refresh_access_token');
  url.search = new URLSearchParams({ grant_type: 'ig_refresh_token', access_token: token }).toString();
  const result = await request(url);
  if (typeof result.access_token !== 'string' || typeof result.expires_in !== 'number') throw new InstagramProviderError(null);
  return { token: result.access_token, expiresAt: new Date(Date.now() + result.expires_in * 1000).toISOString() };
}
export async function createInstagramContainer(userId: string, token: string, imageUrl: string, target: InstagramTarget, caption: string) {
  const body = new URLSearchParams({ image_url: imageUrl });
  if (target === 'story') body.set('media_type', 'STORIES'); else body.set('caption', caption);
  const result = await request(graph(userId + '/media'), { method: 'POST', headers: { Authorization: 'Bearer ' + token }, body });
  if (typeof result.id !== 'string' || !/^\d+$/.test(result.id)) throw new InstagramProviderError(null);
  return result.id;
}
export async function instagramContainerStatus(containerId: string, token: string) {
  const url = graph(containerId); url.searchParams.set('fields', 'status_code');
  const result = await request(url, { headers: { Authorization: 'Bearer ' + token } });
  return String(result.status_code || 'IN_PROGRESS');
}
export async function publishInstagramContainer(userId: string, containerId: string, token: string) {
  const result = await request(graph(userId + '/media_publish'), { method: 'POST', headers: { Authorization: 'Bearer ' + token }, body: new URLSearchParams({ creation_id: containerId }) });
  if (typeof result.id !== 'string' || !/^\d+$/.test(result.id)) throw new InstagramProviderError(null, true);
  return result.id;
}
