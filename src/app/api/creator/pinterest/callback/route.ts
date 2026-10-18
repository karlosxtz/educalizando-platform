import { supabaseAdmin as db } from '@/lib/supabase';
import { SITE_URL } from '@/lib/seo';
import { pinterestConfig, validPinterestState, pinterestStateHash, encryptPinterest, PINTEREST_COOKIE } from '@/lib/pinterest-security';
import { pinterestTokens, pinterestRequest } from '@/lib/pinterest-provider';
export const dynamic = 'force-dynamic';
function back(result: string) { return new Response(null, { status: 303, headers: { Location: `${SITE_URL}/dashboard/pinterest?conexao=${result}`, 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer', 'Set-Cookie': `${PINTEREST_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0` } }); }
export async function GET(request: Request) {
  const url = new URL(request.url), state = url.searchParams.get('state');
  const cookie = request.headers.get('cookie')?.split(';').map(item => item.trim()).find(item => item.startsWith(PINTEREST_COOKIE + '='))?.slice(PINTEREST_COOKIE.length + 1);
  const config = pinterestConfig(); if (!config || !validPinterestState(state, cookie)) return back('invalida');
  try {
    const { data: pending, error } = await db.from('creator_pinterest_oauth_states').delete().eq('state_hash', pinterestStateHash(state!)).gt('expires_at', new Date().toISOString()).select('store_id,user_id').maybeSingle();
    if (error || !pending) return back('invalida');
    if (url.searchParams.has('error')) return back('cancelada');
    const code = url.searchParams.get('code'); if (!code || code.length > 4096) return back('invalida');
    const { data: store, error: storeError } = await db.from('stores').select('id').eq('id', pending.store_id).eq('creator_id', pending.user_id).maybeSingle();
    if (storeError || !store) return back('invalida');
    const tokens = await pinterestTokens(code), account = await pinterestRequest('/user_account', tokens.token);
    if (typeof account.username !== 'string' || !account.username) return back('falhou');
    // A new connection always requires a new board choice and explicit opt-in.
    const { error: removeError } = await db.from('creator_pinterest_connections').delete().eq('store_id', store.id); if (removeError) throw removeError;
    const { error: saveError } = await db.from('creator_pinterest_connections').insert({ store_id: store.id, username: account.username, token_encrypted: encryptPinterest(tokens.token, store.id), refresh_encrypted: encryptPinterest(tokens.refresh, store.id), expires_at: tokens.expiresAt, sandbox: config.sandbox });
    if (saveError) throw saveError;
    return back('conectada');
  } catch { console.error('pinterest_oauth_failed'); return back('falhou'); }
}
