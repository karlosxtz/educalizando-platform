import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const origin = request.headers.get('origin');
    if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: 'Origem não permitida.' }, { status: 403 });
    const body = await request.json();
    const { access_token, refresh_token, event } = body;

    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Autenticação temporariamente indisponível.' }, { status: 503 });
    }

    const response = NextResponse.json({ success: true });

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
      const { error } = await supabase.auth.setSession({
        access_token,
        refresh_token
      });
      if (error) return NextResponse.json({ error: 'Sessão inválida. Entre novamente.' }, { status: 401 });
    } else {
      return NextResponse.json({ error: 'Sessão ausente.' }, { status: 400 });
    }

    return response;
  } catch (err) {
    console.error('Erro na sincronização de sessão:', err);
    return NextResponse.json({ error: 'Falha na sincronização' }, { status: 500 });
  }
}
