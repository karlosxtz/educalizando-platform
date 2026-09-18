import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/api-auth';
import { firstName, getWhatsAppTemplate, renderWhatsAppTemplate, sendEvolutionText } from '@/lib/whatsapp-notification-service';

const allowedRoles = new Set(['creator', 'student', 'affiliate']);

export async function POST(request: Request) {
  try {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

    const body = await request.json();
    const { phone, name, role } = body;

    if (!phone || !name || !allowedRoles.has(role)) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos. Necessário: phone, name, role.' },
        { status: 400 }
      );
    }

    const metadata = user.user_metadata || {};
    const registeredRole = metadata.role === 'affiliate'
      ? 'affiliate'
      : metadata.role === 'creator' || metadata.is_creator === true
        ? 'creator'
        : 'student';
    if (role !== registeredRole) {
      return NextResponse.json({ error: 'O perfil informado não corresponde à conta autenticada.' }, { status: 403 });
    }

    const registeredPhone = String(metadata.whatsapp || metadata.phone || '').replace(/\D/g, '');
    const requestedPhone = String(phone).replace(/\D/g, '');
    if (!registeredPhone || !requestedPhone.endsWith(registeredPhone.slice(-11))) {
      return NextResponse.json({ error: 'O telefone informado não pertence à conta autenticada.' }, { status: 403 });
    }

    const templateKey = role === 'creator' ? 'creatorWelcome' : role === 'affiliate' ? 'affiliateWelcome' : 'studentWelcome';
    const template = await getWhatsAppTemplate(templateKey);
    const message = renderWhatsAppTemplate(template, { nome: firstName(name) });
    const result = await sendEvolutionText(phone, message);
    if (!result.sent) {
      return NextResponse.json({ error: 'Não foi possível enviar a mensagem de boas-vindas.', reason: result.reason }, { status: 503 });
    }
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error('[Evolution API Backend] Erro catastrófico ao processar disparo:', error);
    return NextResponse.json({ error: 'Erro interno no servidor da Educalizando', details: error.message }, { status: 500 });
  }
}
