import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Obter o cookie seguro injetado no login
  const token = request.cookies.get('sb-access-token')?.value;

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

  return NextResponse.next();
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
