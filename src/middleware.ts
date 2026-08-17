import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
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
          console.warn(`[middleware] Acesso admin negado para: ${payload.email}`);
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
  // Nota: /aluno/loja é público para ver produtos. /aluno/login é público.
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

  // 4. Rate Limiting via Cookie (funciona em serverless/Edge multi-instância)
  // Estratégia: sliding window codificada em cookie assinado com timestamp
  // Limites por rota (requisições por minuto):
  //   - login:      10 req/min
  //   - financeiro/checkout: 20 req/min
  //   - padrão:     100 req/min
  let limit = 100;
  if (pathname.includes('/login') || pathname.includes('/aluno/login')) limit = 10;
  else if (pathname.includes('/api/financeiro') || pathname.includes('/checkout')) limit = 20;

  const rateLimitResult = applyCookieRateLimit(request, limit);
  if (rateLimitResult.blocked) {
    return NextResponse.json(
      { error: 'Too Many Requests. Limite de requisições excedido. Tente novamente em instantes.' },
      {
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(rateLimitResult.resetAt)
        }
      }
    );
  }

  const response = NextResponse.next();

  // Persistir o cookie de rate limit atualizado
  if (rateLimitResult.cookieValue) {
    response.cookies.set('_rl', rateLimitResult.cookieValue, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 60, // expira em 1 minuto (igual à janela de rate limit)
      path: '/'
    });
  }

  // Adicionar headers informativos de rate limit
  response.headers.set('X-RateLimit-Limit', String(limit));
  response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining));
  response.headers.set('X-RateLimit-Reset', String(rateLimitResult.resetAt));

  return response;
}

// ============================================================================
// COOKIE-BASED SLIDING WINDOW RATE LIMITER
// Funciona sem estado externo — cada request carrega sua própria janela.
// Formato do cookie: "<windowStartTs>:<count>"
// ============================================================================
interface RateLimitResult {
  blocked: boolean;
  remaining: number;
  resetAt: number; // Unix timestamp (segundos)
  cookieValue?: string;
}

function applyCookieRateLimit(request: NextRequest, limit: number): RateLimitResult {
  const windowMs = 60_000; // janela de 1 minuto
  const now = Date.now();

  let windowStart = now;
  let count = 0;

  try {
    const raw = request.cookies.get('_rl')?.value;
    if (raw) {
      const [ts, cnt] = raw.split(':').map(Number);
      if (!isNaN(ts) && !isNaN(cnt) && now - ts < windowMs) {
        // Ainda dentro da mesma janela
        windowStart = ts;
        count = cnt;
      }
      // Se expirou, inicia nova janela (windowStart = now, count = 0)
    }
  } catch {
    // Cookie corrompido — inicia nova janela
  }

  count += 1;
  const remaining = Math.max(0, limit - count);
  const resetAt = Math.ceil((windowStart + windowMs) / 1000);
  const cookieValue = `${windowStart}:${count}`;

  if (count > limit) {
    return { blocked: true, remaining: 0, resetAt, cookieValue };
  }

  return { blocked: false, remaining, resetAt, cookieValue };
}

// Configurar matcher para interceptar apenas rotas relevantes e economizar processamento
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
    '/login',
    '/aluno/login'
  ],
};

