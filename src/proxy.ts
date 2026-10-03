import { createServerClient } from '@supabase/ssr'
import { NextResponse,type NextRequest } from 'next/server'

const AUTH_CHECK_TIMEOUT_MS = 8_000

class AuthCheckTimeoutError extends Error {
  constructor() {
    super('A validação da sessão excedeu o tempo limite.')
    this.name = 'AuthCheckTimeoutError'
  }
}

async function withAuthTimeout<T>(operation: Promise<T>): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new AuthCheckTimeoutError()), AUTH_CHECK_TIMEOUT_MS)
  })

  try {
    return await Promise.race([operation, timeout])
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

function authenticationUnavailable(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json(
      { error: 'Não foi possível validar sua sessão agora. Tente novamente.' },
      { status: 503, headers: { 'Retry-After': '5' } },
    )
  }

  const url = request.nextUrl.clone()
  url.pathname = '/login'
  url.search = ''
  url.searchParams.set('reason', 'session-timeout')
  url.searchParams.set('returnTo', request.nextUrl.pathname + request.nextUrl.search)
  return NextResponse.redirect(url)
}

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const developmentPolicy = process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''
  const protectedContentSecurityPolicy = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${developmentPolicy};
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https:;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.checkout.infinitepay.io https://api.asaas.com https://arquivos.educalizando.com.br;
    frame-src 'self' https://www.youtube.com;
    worker-src 'self' blob:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'self';
  `.replace(/\s{2,}/g, ' ').trim()
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', protectedContentSecurityPolicy)
  const createProtectedResponse = () => {
    const response = NextResponse.next({ request: { headers: requestHeaders } })
    response.headers.set('Content-Security-Policy', protectedContentSecurityPolicy)
    return response
  }
  let supabaseResponse = createProtectedResponse()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Proxy] Configuração do Supabase ausente em rota protegida.')
    return NextResponse.json({ error: 'Serviço temporariamente indisponível.' }, { status: 503 })
  }
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(keysToSet) {
        keysToSet.forEach(({ name, value, options: _options }) => request.cookies.set(name, value))
        supabaseResponse = createProtectedResponse()
        keysToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
      },
    },
  })

  // getClaims valida a assinatura do JWT e, com chaves assimétricas, evita a
  // consulta remota feita por getUser em toda navegação protegida. O limite de
  // tempo impede que uma sessão vencida ou uma indisponibilidade do provedor
  // mantenha a tela de loading do Next aberta indefinidamente.
  let claims: Record<string, unknown> | null = null
  try {
    const result = await withAuthTimeout(supabase.auth.getClaims())
    claims = result.error ? null : (result.data?.claims as Record<string, unknown> | undefined) || null
  } catch (error) {
    console.error('[Proxy] Falha ao validar a sessão protegida:', error instanceof Error ? error.name : 'erro desconhecido')
    return authenticationUnavailable(request)
  }

  const userId = typeof claims?.sub === 'string' ? claims.sub : null
  const userEmail = typeof claims?.email === 'string' ? claims.email : null
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (!userId) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Sessão não autenticada.' }, { status: 401 })
      }
      const url = request.nextUrl.clone(); url.pathname = '/login'; return NextResponse.redirect(url)
    }
    const superAdminEmail = process.env.SUPERADMIN_EMAIL
    if (!superAdminEmail || userEmail?.trim().toLowerCase() !== superAdminEmail.trim().toLowerCase()) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
      }
      const url = request.nextUrl.clone(); url.pathname = '/dashboard'; return NextResponse.redirect(url)
    }
  }

  if ((pathname.startsWith('/dashboard') || pathname.startsWith('/painel')) && !userId) {
    const url = request.nextUrl.clone(); url.pathname = '/login'; return NextResponse.redirect(url)
  }

  const privateClientRoutes = ['/cliente/dashboard', '/cliente/conta', '/cliente/materiais', '/cliente/clubes']
  if (privateClientRoutes.some((route) => pathname.startsWith(route)) && !userId) {
    const url = request.nextUrl.clone(); url.pathname = '/cliente/login'; return NextResponse.redirect(url)
  }

  if (pathname.startsWith('/api/produtos') || pathname.startsWith('/api/financeiro') || pathname.startsWith('/api/aluno/materiais')) {
    if (!userId && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method) && !pathname.includes('webhook') && !pathname.includes('checkout')) {
      return NextResponse.json({ error: 'Unauthorized. Token missing.' }, { status: 401 })
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/admin/:path*', '/api/admin/:path*', '/dashboard/:path*', '/painel/:path*',
    '/cliente/dashboard/:path*', '/cliente/conta/:path*', '/cliente/materiais/:path*', '/cliente/clubes/:path*',
    '/api/produtos/:path*', '/api/financeiro/:path*', '/api/aluno/materiais/:path*',
  ],
}
