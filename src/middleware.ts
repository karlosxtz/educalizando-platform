import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANTE: supabase.auth.getUser() atualiza o token expirado e garante a sessão real.
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Proteção da Área do Aluno (Compradores)
  if (pathname.startsWith('/aluno') && !pathname.startsWith('/aluno/login') && !pathname.startsWith('/aluno/cadastro') && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/aluno/login'
    return NextResponse.redirect(url)
  }

  // Proteção do Painel do Produtor / Vendedores
  if ((pathname.startsWith('/painel') || pathname.startsWith('/vender')) && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Intercepta todas as rotas, exceto estáticos, imagens e favicon.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
