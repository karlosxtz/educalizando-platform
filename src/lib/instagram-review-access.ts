import 'server-only';

/** Temporary studio access for one authenticated review account; disabled by default. */
export function instagramReviewEmail(now = Date.now()): string | null {
  if (process.env.INSTAGRAM_REVIEW_ENABLED !== 'true') return null;
  const email = process.env.INSTAGRAM_REVIEW_ACCOUNT_EMAIL?.trim().toLowerCase();
  const until = process.env.INSTAGRAM_REVIEW_UNTIL?.trim();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !until) return null;
  const expiry = Date.parse(until);
  if (!Number.isFinite(expiry) || new Date(expiry).toISOString() !== until || expiry <= now) return null;
  return email;
}
