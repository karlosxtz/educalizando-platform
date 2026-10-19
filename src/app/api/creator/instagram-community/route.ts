import { instagramContext, instagramFailure, instagramJson } from '@/lib/instagram-store';
import { readInstagramCommunity, readInstagramCommunityProfile } from '@/lib/instagram-community-server';
import { supabaseAdmin } from '@/lib/supabase';
import { consumeRequestRateLimit, rateLimitResponse } from '@/lib/request-rate-limit';
import { instagramCommunityHandle, instagramCommunityUrl } from '@/lib/instagram-community';
import { instagramConfig } from '@/lib/instagram-security';

export async function GET(request: Request) {
  try {
    const { store } = await instagramContext(request);
    const limit = await consumeRequestRateLimit(request, { namespace: 'instagram-community:' + store.id, limit: 90, windowMs: 60000 });
    if (!limit.allowed) return rateLimitResponse(limit);
    const cards = await readInstagramCommunity();
    const id = new URL(request.url).searchParams.get('profile');
    if (id) {
      const card = cards.find(item => item.id === id);
      if (!card) return instagramJson({ error: 'Este perfil não está disponível na rede.' }, 404);
      return instagramJson({ profile: await readInstagramCommunityProfile(card) });
    }
    // The creator's own connection is scoped by authenticated ownership, never caller input.
    const { data: connection } = await supabaseAdmin.from('creator_instagram_connections').select('username,expires_at').eq('store_id', store.id).maybeSingle();
    const handle = instagramCommunityHandle(connection?.username);
    return instagramJson({ cards, storeId: store.id, statisticsEnabled: !!instagramConfig(), connection: handle ? { handle, url: instagramCommunityUrl(handle), expired: Date.parse(connection!.expires_at) <= Date.now() } : null });
  } catch (error) { return instagramFailure(error); }
}
