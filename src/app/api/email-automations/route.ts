import { NextRequest, NextResponse } from 'next/server';
import { getMailConfiguration, sendAutomationTestEmail } from '@/lib/mail-service';
import { getRequestUser, isSuperAdmin } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  if (!(await isSuperAdmin(request))) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  return NextResponse.json(getMailConfiguration());
}

export async function POST(request: NextRequest) {
  if (!(await isSuperAdmin(request))) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  const user = await getRequestUser(request);
  if (!user?.email) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const body = await request.json() as { action?: string };
  const name = user.user_metadata?.full_name || 'Usuário';
  let result;
  if (body.action !== 'test') return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
  result = await sendAutomationTestEmail(user.email, name);
  return NextResponse.json(result, { status: result.sent ? 200 : 422 });
}
