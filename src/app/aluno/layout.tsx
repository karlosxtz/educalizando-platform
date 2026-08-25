import { cookies, headers } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { redirect } from 'next/navigation'

export default async function AlunoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  const headersList = await headers()
  // Tenta obter o pathname atual de várias formas (já que não temos middleware)
  const pathname = headersList.get('x-invoke-path') || headersList.get('next-url') || headersList.get('referer') || ''
  
  const isAuthRoute = pathname.includes('/aluno/login') || pathname.includes('/aluno/cadastro')

  // Se não estiver logado e a rota não for de autenticação
  if (!session && !isAuthRoute) {
    redirect('/aluno/login')
  }

  return (
    <>
      {children}
    </>
  )
}
