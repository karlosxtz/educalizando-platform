import { NextResponse } from 'next/server';
import { requestCreatorWithdrawal, getWithdrawalsHistory } from '@/lib/withdrawal-service';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyClientPayloadSignature, verifySignedNonce } from '@/lib/crypto-service';
import { getRequestUser } from '@/lib/api-auth';
import { notifyWithdrawalRequested } from '@/lib/withdrawal-notification-service';

export async function GET(request: Request) {
  try {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ success: false, error: 'Acesso negado.' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json({ success: false, error: 'Identificador da loja (storeId) é obrigatório.' }, { status: 400 });
    }

    const { data: ownedStore } = await supabaseAdmin.from('stores').select('creator_id').eq('id', storeId).maybeSingle();
    if (!ownedStore || ownedStore.creator_id !== user.id) {
      return NextResponse.json({ success: false, error: 'Esta loja não pertence ao usuário autenticado.' }, { status: 403 });
    }

    const history = await getWithdrawalsHistory(storeId);
    return NextResponse.json({
      success: true,
      withdrawals: history
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado. Autenticação inválida para esta operação financeira.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { storeId, amount, nonce, expiresAt, serverSignature, clientSignature } = body;
    const creatorProfileCpf = String(user.user_metadata?.cpf || '').replace(/\D/g, '');

    if (!storeId) {
      return NextResponse.json(
        { success: false, error: 'Identificador da loja (storeId) é obrigatório.' },
        { status: 400 }
      );
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json(
        { success: false, error: 'Por favor, informe um valor válido para o saque.' },
        { status: 400 }
      );
    }

    if (!creatorProfileCpf) {
      return NextResponse.json(
        { success: false, error: 'O CPF do perfil do criador é obrigatório para validação.' },
        { status: 400 }
      );
    }

    // Validação de Segurança Criptográfica (Master Foda)
    if (!nonce || !expiresAt || !serverSignature || !clientSignature) {
       return NextResponse.json({ success: false, error: 'Requisição inválida. Ausência de assinaturas de segurança.' }, { status: 400 });
    }

    if (!verifySignedNonce(nonce, expiresAt, serverSignature)) {
       return NextResponse.json({ success: false, error: 'Sessão de saque expirada ou inválida (Replay Attack block).' }, { status: 403 });
    }

    // O cliente assina o payload com o mesmo token autenticado conferido pelo servidor.
    const authHeader = request.headers.get('authorization');
    const validJwt = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1] || '';
    if (!validJwt) {
      return NextResponse.json({ success: false, error: 'Token de autorização obrigatório para solicitar saque.' }, { status: 401 });
    }

    const { data: ownedStore } = await supabaseAdmin.from('stores').select('creator_id').eq('id', storeId).maybeSingle();
    if (!ownedStore || ownedStore.creator_id !== user.id) {
      return NextResponse.json({ success: false, error: 'A loja informada não pertence ao criador autenticado.' }, { status: 403 });
    }

    // Anti-Tampering do Payload (Verifica se ninguém interceptou o proxy e mudou o valor)
    if (!verifyClientPayloadSignature(Number(amount), storeId, nonce, validJwt, clientSignature)) {
       return NextResponse.json({ success: false, error: 'Assinatura do payload inválida. Possível adulteração na requisição detectada.' }, { status: 403 });
    }
    // Executa solicitação no servidor e reserva o saldo para análise manual.
    const withdrawal = await requestCreatorWithdrawal({
      storeId,
      creatorId: user.id,
      amount: Number(amount),
      creatorProfileCpf
    });

    await notifyWithdrawalRequested({
      withdrawalId: withdrawal.id,
      creatorId: user.id,
      storeId,
      amount: withdrawal.amount,
      pixKeyId: withdrawal.pixKeyId,
      pixKeyMasked: withdrawal.pixKeyMasked,
      recipientType: 'creator'
    });

    return NextResponse.json({
      success: true,
      message: 'Solicitação de saque efetuada com sucesso!',
      withdrawal: {
        id: withdrawal.id,
        amount: withdrawal.amount,
        pixKeyMasked: withdrawal.pixKeyMasked,
        status: withdrawal.status,
        requestedAt: withdrawal.requestedAt
      }
    });

  } catch (err: any) {
    console.error('[API Saque Error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Erro ao processar o saque.' },
      { status: 400 }
    );
  }
}
