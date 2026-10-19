import { getRequestUser } from '@/lib/api-auth';
import { instagramReviewEmail } from '@/lib/instagram-review-access';

export const dynamic = 'force-dynamic';
function response(allowed: boolean, status = 200) {
  return Response.json({ allowed }, { status, headers: {
    'Cache-Control': 'private, no-store', Vary: 'Authorization, Cookie',
  } });
}
export async function GET(request: Request) {
  const email = instagramReviewEmail();
  if (!email) return response(false);
  try {
    const user = await getRequestUser(request);
    if (!user) return response(false, 401);
    return response(Boolean(user.email_confirmed_at && user.email?.toLowerCase() === email));
  } catch {
    return response(false, 503);
  }
}
