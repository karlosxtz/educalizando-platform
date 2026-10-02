import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

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
        keysToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
        supabaseResponse = createProtectedResponse()
        keysToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
      },
    },
  })

  // Atualiza a sessão quando necessário. As autorizações definitivas também
  // são verificadas dentro de cada rota de API sensível.
  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (!user) {
      const url = request.nextUrl.clone(); url.pathname = '/login'; return NextResponse.redirect(url)
    }
    const superAdminEmail = process.env.SUPERADMIN_EMAIL
    if (!superAdminEmail || user.email?.trim().toLowerCase() !== superAdminEmail.trim().toLowerCase()) {
      const url = request.nextUrl.clone(); url.pathname = '/dashboard'; return NextResponse.redirect(url)
    }
  }

  if ((pathname.startsWith('/dashboard') || pathname.startsWith('/painel')) && !user) {
    const url = request.nextUrl.clone(); url.pathname = '/login'; return NextResponse.redirect(url)
  }

  const privateClientRoutes = ['/cliente/dashboard', '/cliente/conta', '/cliente/materiais', '/cliente/clubes']
  if (privateClientRoutes.some((route) => pathname.startsWith(route)) && !user) {
    const url = request.nextUrl.clone(); url.pathname = '/cliente/login'; return NextResponse.redirect(url)
  }

  if (pathname.startsWith('/api/produtos') || pathname.startsWith('/api/financeiro') || pathname.startsWith('/api/aluno/materiais')) {
    if (!user && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method) && !pathname.includes('webhook') && !pathname.includes('checkout')) {
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
