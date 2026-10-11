'use client';
export async function authCapabilities() {
  const origin = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!origin || !key) return { google: false, phone: false };
  try {
    const response = await fetch(`${origin.replace(/\/+$/, '')}/auth/v1/settings`, { headers: { apikey: key } });
    if (!response.ok) return { google: false, phone: false };
    const data = await response.json();
    return { google: data.external?.google === true, phone: data.external?.phone === true };
  } catch { return { google: false, phone: false }; }
}
