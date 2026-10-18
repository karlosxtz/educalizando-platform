import 'server-only';
import { pinterestConfig, PINTEREST_CALLBACK } from './pinterest-security';
import { PINTEREST_SCOPES, pinterestId, type PinterestBoard } from './pinterest-contract';

export class PinterestProviderError extends Error {
  constructor(public status: number, public uncertain = false) {
    super(uncertain ? 'O Pinterest não confirmou o resultado. Confira sua conta antes de qualquer novo envio.' : status === 401 ? 'Reconecte o Pinterest para renovar a autorização.' : status === 403 ? 'O Pinterest não autorizou esta operação. Confira o acesso do aplicativo e a pasta escolhida.' : status === 429 ? 'Limite temporário do Pinterest. O envio aguardará uma nova tentativa.' : 'Não foi possível concluir a operação no Pinterest. Confira a conexão e tente novamente.');
  }
}
export async function pinterestRequest(path: string, token: string, body?: unknown): Promise<Record<string, unknown>> {
  const config = pinterestConfig(); if (!config) throw new Error('Pinterest não ativado.');
  let response: Response;
  try {
    response = await fetch(`https://${config.sandbox ? 'api-sandbox' : 'api'}.pinterest.com/v5${path}`, { method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15000) });
  } catch { throw new PinterestProviderError(0, !!body); }
  if (!response.ok) throw new PinterestProviderError(response.status, !!body && (response.status >= 500 || response.status === 408));
  try { return await response.json(); } catch { throw new PinterestProviderError(response.status, !!body); }
}
export async function pinterestTokens(code: string, refresh = false) {
  const config = pinterestConfig(); if (!config) throw new Error('Pinterest não ativado.');
  let response: Response;
  try {
    response = await fetch(`https://${config.sandbox ? 'api-sandbox' : 'api'}.pinterest.com/v5/oauth/token`, { method: 'POST', headers: { Authorization: 'Basic ' + Buffer.from(`${config.id}:${config.secret}`).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(refresh ? { grant_type: 'refresh_token', refresh_token: code } : { grant_type: 'authorization_code', code, redirect_uri: PINTEREST_CALLBACK }), redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(15000) });
  } catch { throw new PinterestProviderError(0); }
  if (!response.ok) throw new PinterestProviderError(response.status);
  const data = await response.json();
  if (typeof data.access_token !== 'string' || !data.access_token || !Number.isFinite(data.expires_in) || data.expires_in <= 0 || (!refresh && typeof data.refresh_token !== 'string')) throw new PinterestProviderError(502);
  if (!refresh && !PINTEREST_SCOPES.every(scope => String(data.scope || '').split(/[ ,]+/).includes(scope))) throw new PinterestProviderError(403);
  return { token: data.access_token as string, refresh: typeof data.refresh_token === 'string' ? data.refresh_token : code, expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString() };
}
export async function pinterestBoards(token: string, bookmark?: string) {
  const query = new URLSearchParams({ page_size: '100', privacy: 'PUBLIC' });
  if (bookmark) query.set('bookmark', bookmark);
  const data = await pinterestRequest('/boards?' + query, token);
  const boards: PinterestBoard[] = (Array.isArray(data.items) ? data.items : []).filter(item => pinterestId(item?.id) && typeof item.name === 'string' && item.privacy === 'PUBLIC').map(item => ({ id: item.id, name: item.name, privacy: item.privacy }));
  return { boards, bookmark: typeof data.bookmark === 'string' ? data.bookmark : null };
}
