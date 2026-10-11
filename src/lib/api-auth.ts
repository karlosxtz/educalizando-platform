import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from './supabase';
import { requiresSecondFactor } from './auth-assurance';

/** Resolve a sessão tanto do Bearer token quanto do cookie SSR do Supabase. */
export async function getRequestUser(request: Request) {
  const bearerToken = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
  if (bearerToken) {
    const { data, error } = await supabaseAdmin.auth.getUser(bearerToken);
    if (!error && data.user?.factors?.some(f => f.status === 'verified')) {
      const claims = await supabaseAdmin.auth.getClaims(bearerToken);
      if (claims.error || requiresSecondFactor(data.user.factors, claims.data?.claims.aal)) return null;
    }
    return error ? null : data.user;
  }

  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;

  // O pacote SSR entende cookies modernos, prefixados e divididos em chunks.
  const serverSupabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // Esta função apenas resolve a identidade; a renovação fica no middleware.
      }
    }
  });
  const { data, error } = await serverSupabase.auth.getUser();
  if (!error && data.user?.factors?.some(f => f.status === 'verified')) {
    const claims = await serverSupabase.auth.getClaims();
    if (claims.error || requiresSecondFactor(data.user.factors, claims.data?.claims.aal)) return null;
  }
  return error ? null : data.user;
}

export async function isSuperAdmin(request: Request) {
  const user = await getRequestUser(request);
  const configuredEmail = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();
  return Boolean(user?.email && configuredEmail && user.email.toLowerCase() === configuredEmail);
}
