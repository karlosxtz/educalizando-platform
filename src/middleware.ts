import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xyzcompany.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy'

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(keysToSet) {
          keysToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          keysToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Faz a checagem da sessão e atualiza/refaz o refresh token via setAll automaticamente se necessário
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // 0. Proteger rotas Super Admin
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (pathname.includes('debug-wallet')) {
      // allow debug endpoint
    } else if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    } else {
      const superAdminEmail = process.env.SUPERADMIN_EMAIL || 'rafinhaagathathamy@gmail.com'
      if (user.email !== superAdminEmail) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }
    }
  }

  // 1. Proteger rotas do Criador (Dashboard/Painel)
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/painel')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  // 2. Proteger rotas do Aluno (Área Logada)
  const privateStudentRoutes = ['/aluno/dashboard', '/aluno/conta', '/aluno/materiais']
  if (privateStudentRoutes.some(route => pathname.startsWith(route))) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/aluno/login'
      return NextResponse.redirect(url)
    }
  }

  // 3. Proteger rotas sensíveis de API
  if (pathname.startsWith('/api/produtos') || pathname.startsWith('/api/financeiro') || pathname.startsWith('/api/aluno/materiais')) {
    if (!user && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      if (!pathname.includes('webhook') && !pathname.includes('checkout')) {
        return NextResponse.json({ error: 'Unauthorized. Token missing.' }, { status: 401 })
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/dashboard/:path*',
    '/painel/:path*',
    '/aluno/dashboard/:path*',
    '/aluno/conta/:path*',
    '/aluno/materiais/:path*',
    '/api/produtos/:path*',
    '/api/financeiro/:path*',
    '/api/aluno/materiais/:path*',
  ],
}

