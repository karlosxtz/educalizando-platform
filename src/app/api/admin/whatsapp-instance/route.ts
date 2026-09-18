import { NextResponse } from 'next/server';
import { isSuperAdmin } from '@/lib/api-auth';
import { getEvolutionConnectionQrCode, getEvolutionInstanceHealth, logoutEvolutionInstance, restartEvolutionInstance, sendEvolutionText } from '@/lib/whatsapp-notification-service';

export async function GET(request: Request) {
  if (!(await isSuperAdmin(request))) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  return NextResponse.json({ success: true, health: await getEvolutionInstanceHealth() });
}

export async function POST(request: Request) {
  if (!(await isSuperAdmin(request))) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  const body = await request.json();

  if (body.action === 'test') {
    const text = typeof body.text === 'string' ? body.text.trim().slice(0, 2000) : '';
    if (!text) return NextResponse.json({ error: 'Escreva uma mensagem para o teste.' }, { status: 400 });
    const result = await sendEvolutionText(body.phone, text);
    if (!result.sent) {
      return NextResponse.json({
        error: result.error || 'Não foi possível enviar a mensagem de teste.',
        reason: result.reason,
      }, { status: result.reason === 'invalid_phone' ? 400 : 503 });
    }
    return NextResponse.json({ success: true });
  }

  if (body.action === 'disconnect') {
    const result = await logoutEvolutionInstance();
    if (!result.disconnected) return NextResponse.json({ error: result.error || 'Não foi possível desconectar a instância.' }, { status: 503 });
    return NextResponse.json({ success: true });
  }

  if (body.action === 'restart') {
    const result = await restartEvolutionInstance();
    if (!result.restarted) return NextResponse.json({ error: result.error || 'Não foi possível reiniciar a instância.' }, { status: 503 });
    return NextResponse.json({ success: true });
  }

  if (body.action === 'qrcode') {
    const result = await getEvolutionConnectionQrCode(Boolean(body.force));
    if (result.error && !result.qrCode) return NextResponse.json({ error: result.error, connection: result }, { status: 503 });
    return NextResponse.json({ success: true, connection: result });
  }

  return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
}
