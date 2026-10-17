import { supabaseAdmin as db } from '@/lib/supabase';
import { instagramConfig, newInstagramState, instagramStateHash, instagramAuthorizationUrl, INSTAGRAM_STATE_COOKIE } from '@/lib/instagram-security';
import { instagramContext, instagramJson, instagramFailure, instagramBody, InstagramInputError } from '@/lib/instagram-store';
import { consumeRequestRateLimit, rateLimitResponse } from '@/lib/request-rate-limit';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try {
    const { store } = await instagramContext(request);
    const [{ data: account, error }, { data: posts, error: postError }] = await Promise.all([
      db.from('creator_instagram_connections').select('username,account_type,expires_at').eq('store_id', store.id).maybeSingle(),
      db.from('creator_instagram_posts').select('id,target,status,media_id,error_message,created_at').eq('store_id', store.id).order('created_at', { ascending: false }).limit(15),
    ]);
    if (error || postError) {
      const code = (error || postError)?.code;
      if (['42P01', 'PGRST205'].includes(code || '')) return instagramJson({ configured: !!instagramConfig(), migrationRequired: true, account: null, posts: [] });
      throw error || postError;
    }
    return instagramJson({ configured: !!instagramConfig(), migrationRequired: false, account: account ? { ...account, expired: Date.parse(account.expires_at) <= Date.now() } : null, posts: posts || [] });
  } catch (error) { return instagramFailure(error); }
}
export async function POST(request: Request) {
  try {
    const { user, store } = await instagramContext(request);
    const limit = await consumeRequestRateLimit(request, { namespace: 'instagram-connect:' + store.id, limit: 10, windowMs: 3600000 });
    if (!limit.allowed) return rateLimitResponse(limit);
    const body = await instagramBody(request);
    if (body.action !== 'connect') throw new InstagramInputError('Ação inválida.');
    if (!instagramConfig()) throw new InstagramInputError('A publicação direta aguarda a ativação do aplicativo da Educalizando na Meta.', 503);
    const state = newInstagramState();
    const { error } = await db.from('creator_instagram_oauth_states').upsert({ store_id: store.id, user_id: user.id, state_hash: instagramStateHash(state), expires_at: new Date(Date.now() + 600000).toISOString() }, { onConflict: 'store_id' });
    if (error) throw error;
    const response = instagramJson({ authorizationUrl: instagramAuthorizationUrl(state) });
    response.headers.set('Set-Cookie', `${INSTAGRAM_STATE_COOKIE}=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`);
    return response;
  } catch (error) { return instagramFailure(error); }
}
export async function DELETE(request: Request) {
  try {
    const { store } = await instagramContext(request);
    const { error: stateError } = await db.from('creator_instagram_oauth_states').delete().eq('store_id', store.id); if (stateError) throw stateError;
    const { error } = await db.from('creator_instagram_connections').delete().eq('store_id', store.id); if (error) throw error;
    return instagramJson({ disconnected: true });
  } catch (error) { return instagramFailure(error); }
}
