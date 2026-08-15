import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { access_token, refresh_token, event } = body;

    const cookieStore = await cookies();

    if (event === 'SIGNED_OUT') {
      cookieStore.delete('sb-access-token');
      cookieStore.delete('sb-refresh-token');
      return NextResponse.json({ success: true, message: 'Cookies cleared' });
    }

    if (access_token) {
      // Secure, HttpOnly cookie para armazenar o JWT
      cookieStore.set({
        name: 'sb-access-token',
        value: access_token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 1 semana
      });
    }

    if (refresh_token) {
      cookieStore.set({
        name: 'sb-refresh-token',
        value: refresh_token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 1 semana
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Erro na sincronização de sessão:', err);
    return NextResponse.json({ error: 'Falha na sincronização' }, { status: 500 });
  }
}
