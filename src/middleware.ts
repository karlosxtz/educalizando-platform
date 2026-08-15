import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Obter o cookie seguro injetado no login
  const token = request.cookies.get('sb-access-token')?.value;

  // 0. Proteger rotas Super Admin (Prioridade Máxima)
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const superAdminEmail = process.env.SUPERADMIN_EMAIL || 'rafinhaagathathamy@gmail.com';
      if (payload.email !== superAdminEmail) {
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
  // Obs: a rota /api/produtos aceita GET sem token (vitrine), mas POST/PUT/DELETE exige token.
  // Como estamos no edge middleware, podemos barrar métodos perigosos sem token
  if (pathname.startsWith('/api/produtos') || pathname.startsWith('/api/financeiro') || pathname.startsWith('/api/aluno/materiais')) {
    // Se for uma requisição que altera dados e não tem token
    if (!token && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      // Ignorar rotas de checkout ou webhooks que não dependem do token do usuário
      if (!pathname.includes('webhook') && !pathname.includes('checkout')) {
        return NextResponse.json({ error: 'Unauthorized. Token missing.' }, { status: 401 });
      }
    }
  }

  // 4. Rate Limiting Simplificado (Mitigação de Brute Force / DDoS em Memória)
  // Limites por IP:
  // - Login: 10 requisições por minuto
  // - Financeiro (Saque/Checkout): 20 requisições por minuto
  // - Outras rotas sensíveis: 60 requisições por minuto
  const ip = request.headers.get('x-forwarded-for') || request.ip || 'unknown_ip';
  
  if (ip !== 'unknown_ip') {
    let limit = 100; // default
    if (pathname.includes('/login')) limit = 10;
    else if (pathname.includes('/api/financeiro') || pathname.includes('/checkout')) limit = 20;

    const rateLimitResponse = applyRateLimit(ip, limit);
    if (rateLimitResponse) return rateLimitResponse;
  }

  return NextResponse.next();
}

// Map estático para armazenar as contagens (Eficaz em single-instance ou para segurar rajadas no mesmo Edge node)
const rateLimitCache = new Map<string, { count: number; expiresAt: number }>();

function applyRateLimit(ip: string, limit: number): NextResponse | null {
  const now = Date.now();
  const windowMs = 60000; // 1 minuto
  
  let record = rateLimitCache.get(ip);
  
  if (!record || now > record.expiresAt) {
    // Novo registro ou expirado
    rateLimitCache.set(ip, { count: 1, expiresAt: now + windowMs });
    return null; // OK
  }
  
  record.count += 1;
  
  if (record.count > limit) {
    return NextResponse.json(
      { error: 'Too Many Requests. Limite de requisições excedido. Tente novamente em alguns instantes.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }
  
  rateLimitCache.set(ip, record);
  return null; // OK
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
    '/api/aluno/materiais/:path*'
  ],
};
