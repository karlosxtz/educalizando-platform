import { NextResponse } from 'next/server';
import { isSuperAdmin } from '@/lib/api-auth';

export async function POST(request: Request) {
  try {
    if (!(await isSuperAdmin(request))) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Nunca gere uma sessão como outro usuário. A auditoria deve ocorrer pelos
    // dados administrativos, sem expor um magic link que permitiria assumir a
    // identidade de um criador.
    return NextResponse.json({ error: 'Acesso como criador está desativado por segurança.' }, { status: 410 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
