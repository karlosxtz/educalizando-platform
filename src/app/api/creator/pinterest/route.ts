import { supabaseAdmin as db } from '@/lib/supabase';
import { consumeRequestRateLimit } from '@/lib/request-rate-limit';
import { pinterestConfig, newPinterestState, pinterestStateHash, pinterestAuthorizationUrl, PINTEREST_COOKIE } from '@/lib/pinterest-security';
import { pinterestContext, pinterestBody, pinterestJson, pinterestFailure, PinterestInputError, readPinterestConnection, usablePinterestToken } from '@/lib/pinterest-store';
import { pinterestRequest, pinterestBoards } from '@/lib/pinterest-provider';
import { pinterestId } from '@/lib/pinterest-contract';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try {
    const { store } = await pinterestContext(request);
    const config = pinterestConfig();
    const connection = await readPinterestConnection(store.id);
    if (new URL(request.url).searchParams.has('boards')) {
      if (!connection) throw new PinterestInputError('Conecte o Pinterest primeiro.');
      const limit = await consumeRequestRateLimit(request, { namespace: 'pinterest-boards:' + store.id, limit: 20, windowMs: 60000 });
      if (!limit.allowed) throw new PinterestInputError('Aguarde um minuto antes de consultar novamente.', 429);
      const bookmark = new URL(request.url).searchParams.get('bookmark') || undefined;
      if (bookmark && bookmark.length > 2000) throw new PinterestInputError('Página inválida.');
      return pinterestJson(await pinterestBoards(await usablePinterestToken(connection), bookmark));
    }
    const { data: jobs, error } = await db.from('creator_pinterest_jobs').select('id,product_id,title,status,pin_id,error_message,created_at').eq('store_id', store.id).order('created_at', { ascending: false }).limit(30);
    if (error) throw error;
    return pinterestJson({ configured: !!config, sandbox: config?.sandbox ?? true, migrationRequired: false, account: connection ? { username: connection.username, board_id: connection.board_id, board_name: connection.board_name, auto_publish: connection.auto_publish } : null, jobs: jobs || [] });
  } catch (error) {
    if (['42P01', 'PGRST205'].includes((error as { code?: string })?.code || '')) return pinterestJson({ configured: !!pinterestConfig(), sandbox: pinterestConfig()?.sandbox ?? true, migrationRequired: true, account: null, jobs: [] });
    return pinterestFailure(error);
  }
}
export async function POST(request: Request) {
  try {
    const { user, store } = await pinterestContext(request);
    const limit = await consumeRequestRateLimit(request, { namespace: 'pinterest-config:' + store.id, limit: 15, windowMs: 60000 });
    if (!limit.allowed) throw new PinterestInputError('Aguarde um minuto antes de continuar.', 429);
    const body = await pinterestBody(request);
    if (!pinterestConfig()) throw new PinterestInputError('A conexão aguarda a ativação do aplicativo Pinterest da Educalizando.', 503);
    if (body.action === 'connect') {
      const state = newPinterestState();
      const { error } = await db.from('creator_pinterest_oauth_states').upsert({ store_id: store.id, user_id: user.id, state_hash: pinterestStateHash(state), expires_at: new Date(Date.now() + 600000).toISOString() }, { onConflict: 'store_id' });
      if (error) throw error;
      const response = pinterestJson({ authorizationUrl: pinterestAuthorizationUrl(state) });
      response.headers.set('Set-Cookie', `${PINTEREST_COOKIE}=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`);
      return response;
    }
    const connection = await readPinterestConnection(store.id); if (!connection) throw new PinterestInputError('Conecte o Pinterest primeiro.');
    if (body.action !== 'settings' || typeof body.autoPublish !== 'boolean' || !pinterestId(body.boardId)) throw new PinterestInputError('Escolha uma pasta e confirme a opção de publicação automática.');
    const board = await pinterestRequest('/boards/' + body.boardId, await usablePinterestToken(connection));
    if (board.id !== body.boardId || board.privacy !== 'PUBLIC' || typeof board.name !== 'string') throw new PinterestInputError('Escolha uma pasta pública da conta conectada.');
    const { data, error } = await db.from('creator_pinterest_connections').update({ board_id: body.boardId, board_name: board.name, auto_publish: body.autoPublish, updated_at: new Date().toISOString() }).eq('id', connection.id).eq('store_id', store.id).select('id').maybeSingle();
    if (error) throw error; if (!data) throw new PinterestInputError('A conexão mudou. Atualize a página.', 409);
    if (!body.autoPublish) {
      const { error: cancelError } = await db.from('creator_pinterest_jobs').update({ status: 'cancelled', error_message: 'Automação pausada pelo criador.' }).eq('store_id', store.id).eq('status', 'queued').eq('source', 'automatic');
      if (cancelError) throw cancelError;
    }
    return pinterestJson({ saved: true });
  } catch (error) { return pinterestFailure(error); }
}
export async function DELETE(request: Request) {
  try {
    const { store } = await pinterestContext(request);
    const { error: stateError } = await db.from('creator_pinterest_oauth_states').delete().eq('store_id', store.id); if (stateError) throw stateError;
    const { error } = await db.from('creator_pinterest_connections').delete().eq('store_id', store.id); if (error) throw error;
    const { error: cancelError } = await db.from('creator_pinterest_jobs').update({ status: 'cancelled', error_message: 'Conexão encerrada pelo criador.' }).eq('store_id', store.id).eq('status', 'queued'); if (cancelError) throw cancelError;
    return pinterestJson({ disconnected: true });
  } catch (error) { return pinterestFailure(error); }
}
