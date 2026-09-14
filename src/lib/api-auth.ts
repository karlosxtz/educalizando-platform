import { cookies } from 'next/headers';
import { supabaseAdmin } from './supabase';

/** Resolve a sessão tanto do Bearer token quanto do cookie SSR do Supabase. */
export async function getRequestUser(request: Request) {
  let token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
  if (!token) {
    const cookieStore = await cookies();
    token = cookieStore.get('sb-access-token')?.value || '';
  }
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  return error ? null : data.user;
}

export async function isSuperAdmin(request: Request) {
  const user = await getRequestUser(request);
  const configuredEmail = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();
  return Boolean(user?.email && configuredEmail && user.email.toLowerCase() === configuredEmail);
}
