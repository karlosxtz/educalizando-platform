import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Obter os cookies seguros injetados no login
  let token = request.cookies.get('sb-access-token')?.value;
  const refreshToken = request.cookies.get('sb-refresh-token')?.value;
  let response = NextResponse.next();
  let tokenRefreshed = false;

  // 0. Auto Refresh Session se estiver perto de expirar
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000;
      const now = Date.now();
      const timeRemaining = exp - now;

      // Se expira em menos de 5 minutos (300.000 ms) ou já expirou, e temos o refresh token
      if (timeRemaining < 300000 && refreshToken) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xyzcompany.supabase.co';
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy';
        
        if (!supabaseUrl.includes('xyzcompany')) {
          const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
            method: 'POST',
            headers: {
              'apikey': supabaseAnonKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.access_token && data.refresh_token) {
              token = data.access_token;
              
              // Modifica os cookies da requisição atual para que as rotas subsequentes vejam o token novo
              request.cookies.set('sb-access-token', data.access_token);
              request.cookies.set('sb-refresh-token', data.refresh_token);
              
              // Cria uma nova resposta baseada no request modificado
              response = NextResponse.next({
                request: {
                  headers: request.headers,
                }
              });

              const cookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax' as const,
                path: '/',
                maxAge: 60 * 60 * 24 * 7 // 1 semana
              };

              response.cookies.set('sb-access-token', data.access_token, cookieOptions);
              response.cookies.set('sb-refresh-token', data.refresh_token, cookieOptions);
              
              tokenRefreshed = true;
            }
          } else {
            // Se o refresh falhar (ex: token revogado), apaga os cookies
            response.cookies.delete('sb-access-token');
            response.cookies.delete('sb-refresh-token');
            token = undefined; // Força falha nas validações abaixo
          }
        }
      }
    } catch (e) {
      console.error('[proxy] Erro ao decodificar/renovar JWT:', e);
    }
  }

  // 0. Proteger rotas Super Admin (Prioridade Máxima)
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (pathname.includes('debug-wallet')) {
      // allow debug endpoint (sem proteção intencional)
    } else if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    } else {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const superAdminEmail = process.env.SUPERADMIN_EMAIL || 'rafinhaagathathamy@gmail.com';
        if (payload.email !== superAdminEmail) {
          console.warn(`[proxy] Acesso admin negado para: ${payload.email}`);
          const url = request.nextUrl.clone();
          url.pathname = '/dashboard';
          return NextResponse.redirect(url);
        }
      } catch (e) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
      }
    }
  }

  // 1. Proteger rotas do Criador (Dashboard)
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  // 2. Proteger rotas do Aluno (Área Logada)
  const privateStudentRoutes = ['/aluno/dashboard', '/aluno/conta', '/aluno/materiais'];
  if (privateStudentRoutes.some(route => pathname.startsWith(route))) {
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = '/aluno/login';
      return NextResponse.redirect(url);
    }
  }

  // 3. Proteger rotas sensíveis de API
  if (pathname.startsWith('/api/produtos') || pathname.startsWith('/api/financeiro') || pathname.startsWith('/api/aluno/materiais')) {
    if (!token && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      if (!pathname.includes('webhook') && !pathname.includes('checkout')) {
        return NextResponse.json({ error: 'Unauthorized. Token missing.' }, { status: 401 });
      }
    }
  }

  return response;
}

// Configurar matcher para interceptar apenas rotas relevantes
export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/dashboard/:path*',
    '/aluno/dashboard/:path*',
    '/aluno/conta/:path*',
    '/aluno/materiais/:path*',
    '/api/produtos/:path*',
    '/api/financeiro/:path*',
    '/api/aluno/materiais/:path*',
  ],
};
