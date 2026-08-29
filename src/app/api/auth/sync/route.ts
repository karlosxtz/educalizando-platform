import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { access_token, refresh_token, event } = body;

    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xyzcompany.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy';

    let response = NextResponse.json({ success: true });

    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(keysToSet) {
            keysToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          }
        }
      }
    );

    if (event === 'SIGNED_OUT') {
      await supabase.auth.signOut();
      cookieStore.delete('educalizando_affiliates');
      cookieStore.delete('educalizando_affiliate_id');
      // Limpeza de legado
      cookieStore.delete('sb-access-token');
      cookieStore.delete('sb-refresh-token');
      return NextResponse.json({ success: true, message: 'Cookies cleared' });
    }

    if (access_token && refresh_token) {
      await supabase.auth.setSession({
        access_token,
        refresh_token
      });
    }

    return response;
  } catch (err) {
    console.error('Erro na sincronização de sessão:', err);
    return NextResponse.json({ error: 'Falha na sincronização' }, { status: 500 });
  }
}
