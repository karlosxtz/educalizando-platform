import { getRequestUser } from '@/lib/api-auth';
import { writeVerifiedProductReview } from '@/lib/product-review-write';
import { isUuid } from '@/lib/conversion-events';
import { consumeRequestRateLimit, rateLimitResponse } from '@/lib/request-rate-limit';

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Authorization, Cookie' } });
export async function POST(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return json({ error: 'Faça login para avaliar este material.' }, 401);
  const limit = await consumeRequestRateLimit(request, { namespace: `review:${user.id}`, limit: 10, windowMs: 60000 });
  if (!limit.allowed) return rateLimitResponse(limit);
  const body = await request.json().catch(() => null);
  if (!isUuid(body?.productId) || !isUuid(body?.storeId)) return json({ error: 'Material ou loja inválidos.' }, 400);
  const result = await writeVerifiedProductReview(user, { productId: body.productId, storeId: body.storeId, studentId: user.id, nota: body.nota, comentario: body.comentario });
  return json(result, result.success ? 200 : 400);
}
