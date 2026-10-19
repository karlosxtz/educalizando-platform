import 'server-only';
import { supabase, supabaseAdmin } from './supabase';
import { collectSitemapRows } from './sitemap-pagination';
import { instagramConfig, decryptInstagramToken } from './instagram-security';
import { instagramCommunityCard, instagramCommunityCount, instagramCommunityHandle, instagramCommunityPhoto, instagramCommunityOrder, type InstagramCommunityCard, type InstagramCommunityProfile } from './instagram-community';

let directory: { until: number; cards: InstagramCommunityCard[] } | null = null;
let readingDirectory: Promise<InstagramCommunityCard[]> | null = null;
const snapshots = new Map<string, { until: number; value: InstagramCommunityProfile }>();
const inFlight = new Map<string, Promise<InstagramCommunityProfile>>();
const unavailable = (): InstagramCommunityProfile => ({ available: false, photo: null, followers: null, mediaCount: null, checkedAt: null });

export async function readInstagramCommunity() {
  if (directory && directory.until > Date.now()) return directory.cards;
  if (readingDirectory) return readingDirectory;
  readingDirectory = (async () => {
    // Deliberately use public RLS reads and an explicit DTO, never service-role store rows.
    const rows = await collectSitemapRows((from, to) => supabase.from('stores').select('id,nome_loja,slug,descricao,logo_url,banner_url,instagram').not('instagram', 'is', null).neq('slug', 'eduardoadmin').order('id').range(from, to));
    const day = new Date().toISOString().slice(0, 10);
    const cards = rows.map(instagramCommunityCard).filter((card): card is InstagramCommunityCard => !!card).sort((a, b) => instagramCommunityOrder(a.id, day) - instagramCommunityOrder(b.id, day) || a.id.localeCompare(b.id));
    directory = { until: Date.now() + 60000, cards };
    return cards;
  })();
  try { return await readingDirectory; } finally { readingDirectory = null; }
}
/** Only public statistics of an already-public handle. Tokens never leave this module. */
export async function readInstagramCommunityProfile(card: InstagramCommunityCard): Promise<InstagramCommunityProfile> {
  const config = instagramConfig();
  if (!config) return unavailable(); // Respect the existing Meta feature gate.
  const key = card.id + ':' + card.handle;
  const cached = snapshots.get(key);
  if (cached && cached.until > Date.now()) return cached.value;
  if (inFlight.has(key)) return inFlight.get(key)!;
  if (inFlight.size >= 4) return unavailable(); // Bound graph calls per Worker isolate.
  const reading = (async () => {
    let value = unavailable();
    try {
      const { data: connection, error } = await supabaseAdmin.from('creator_instagram_connections').select('instagram_user_id,username,token_encrypted,expires_at').eq('store_id', card.id).maybeSingle();
      // A private connection never publishes a different/unlisted Instagram identity.
      if (error || !connection || instagramCommunityHandle(connection.username) !== card.handle || Date.parse(connection.expires_at) <= Date.now() || !/^\d+$/.test(connection.instagram_user_id)) return value;
      const token = decryptInstagramToken(connection.token_encrypted, card.id);
      const url = new URL(`https://graph.instagram.com/${config.version}/${connection.instagram_user_id}`);
      url.searchParams.set('fields', 'username,profile_picture_url,followers_count,media_count');
      const response = await fetch(url, { headers: { Authorization: 'Bearer ' + token }, redirect: 'manual', cache: 'no-store', signal: AbortSignal.timeout(6000) });
      if (!response.ok) return value;
      const reader = response.body?.getReader(); if (!reader) return value;
      const chunks: Uint8Array[] = []; let length = 0;
      try { while (true) { const part = await reader.read(); if (part.done) break; length += part.value.length; if (length > 32768) return value; chunks.push(part.value); } } finally { await reader.cancel(); }
      const bytes = new Uint8Array(length); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
      const body = JSON.parse(new TextDecoder().decode(bytes));
      if (body.error || instagramCommunityHandle(body.username) !== card.handle) return value;
      value = { available: true, photo: instagramCommunityPhoto(body.profile_picture_url), followers: instagramCommunityCount(body.followers_count), mediaCount: instagramCommunityCount(body.media_count), checkedAt: new Date().toISOString() };
    } catch { /* Expired tokens, unsupported fields and Meta outages preserve the directory. */ }
    finally {
      if (snapshots.size >= 256) snapshots.delete(snapshots.keys().next().value!);
      snapshots.set(key, { until: Date.now() + (value.available ? 3600000 : 300000), value });
    }
    return value;
  })();
  inFlight.set(key, reading);
  try { return await reading; } finally { inFlight.delete(key); }
}
