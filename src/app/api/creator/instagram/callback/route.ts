import { supabaseAdmin as db } from '@/lib/supabase';
import { SITE_URL } from '@/lib/seo';
import { INSTAGRAM_STATE_COOKIE, validInstagramState, instagramStateHash, encryptInstagramToken, instagramConfig } from '@/lib/instagram-security';
import { exchangeInstagramCode } from '@/lib/instagram-provider';
export const dynamic = 'force-dynamic';
function back(status: string) {
  return new Response(null, { status: 303, headers: { Location: `${SITE_URL}/dashboard/instagram?conexao=${status}`, 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer', 'Set-Cookie': `${INSTAGRAM_STATE_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0` } });
}
export async function GET(request: Request) {
  const url = new URL(request.url), state = url.searchParams.get('state');
  const cookie = request.headers.get('cookie')?.split(';').map(value => value.trim()).find(value => value.startsWith(INSTAGRAM_STATE_COOKIE + '='))?.slice(INSTAGRAM_STATE_COOKIE.length + 1);
  if (!instagramConfig() || !validInstagramState(state, cookie)) return back('invalida');
  try {
    const { data: pending, error } = await db.from('creator_instagram_oauth_states').delete().eq('state_hash', instagramStateHash(state!)).gt('expires_at', new Date().toISOString()).select('store_id,user_id').maybeSingle();
    if (error || !pending) return back('invalida');
    if (url.searchParams.has('error')) return back('cancelada');
    const code = url.searchParams.get('code'); if (!code || code.length > 4096) return back('invalida');
    const { data: store, error: storeError } = await db.from('stores').select('id').eq('id', pending.store_id).eq('creator_id', pending.user_id).maybeSingle();
    if (storeError || !store) return back('invalida');
    const account = await exchangeInstagramCode(code);
    // Reconnecting invalidates pending jobs bound to the old connection/account.
    const { error: removeError } = await db.from('creator_instagram_connections').delete().eq('store_id', store.id); if (removeError) throw removeError;
    const { error: saveError } = await db.from('creator_instagram_connections').insert({ store_id: store.id, instagram_user_id: account.userId, username: account.username, account_type: account.accountType, token_encrypted: encryptInstagramToken(account.token, store.id), expires_at: account.expiresAt });
    if (saveError) throw saveError;
    return back('conectada');
  } catch { return back('falhou'); }
}
