import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xyzcompany.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy'
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(keysToSet) {
        keysToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
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

  const privateClientRoutes = ['/cliente/dashboard', '/cliente/conta', '/cliente/materiais']
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
    '/cliente/dashboard/:path*', '/cliente/conta/:path*', '/cliente/materiais/:path*',
    '/api/produtos/:path*', '/api/financeiro/:path*', '/api/aluno/materiais/:path*',
  ],
}
