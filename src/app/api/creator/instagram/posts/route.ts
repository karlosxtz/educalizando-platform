import { instagramBody, instagramContext, instagramFailure, instagramJson, InstagramInputError } from '@/lib/instagram-store';
import { instagramConfig } from '@/lib/instagram-security';
import { prepareInstagramPost, advanceInstagramPost } from '@/lib/instagram-publishing';
import { isInstagramUuid } from '@/lib/instagram-contract';
import { consumeRequestRateLimit, rateLimitResponse } from '@/lib/request-rate-limit';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  try {
    const { store } = await instagramContext(request);
    if (!instagramConfig()) throw new InstagramInputError('A publicação direta aguarda a ativação do aplicativo da Educalizando na Meta.', 503);
    const body = await instagramBody(request);
    const limit = await consumeRequestRateLimit(request, { namespace: `instagram-${body.action === 'prepare' ? 'prepare' : 'publish'}:${store.id}`, limit: body.action === 'prepare' ? 10 : 60, windowMs: 60000 });
    if (!limit.allowed) return rateLimitResponse(limit);
    if (body.action === 'prepare') return instagramJson(await prepareInstagramPost(store.id, body));
    if (body.action !== 'advance' || !isInstagramUuid(body.id)) throw new InstagramInputError('Solicitação inválida.');
    return instagramJson({ post: await advanceInstagramPost(store.id, body.id, true) });
  } catch (error) { return instagramFailure(error); }
}
export async function GET(request: Request) {
  try {
    const { store } = await instagramContext(request);
    const limit = await consumeRequestRateLimit(request, { namespace: 'instagram-status:' + store.id, limit: 60, windowMs: 60000 });
    if (!limit.allowed) return rateLimitResponse(limit);
    const id = new URL(request.url).searchParams.get('id');
    if (!isInstagramUuid(id)) throw new InstagramInputError('Publicação inválida.');
    return instagramJson({ post: await advanceInstagramPost(store.id, id, false) });
  } catch (error) { return instagramFailure(error); }
}
