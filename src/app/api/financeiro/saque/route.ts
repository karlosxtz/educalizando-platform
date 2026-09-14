import { NextResponse } from 'next/server';
import { requestCreatorWithdrawal, getWithdrawalsHistory } from '@/lib/withdrawal-service';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyClientPayloadSignature, verifySignedNonce } from '@/lib/crypto-service';
import { getRequestUser } from '@/lib/api-auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json({ success: false, error: 'Identificador da loja (storeId) é obrigatório.' }, { status: 400 });
    }

    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ success: false, error: 'Acesso negado.' }, { status: 401 });
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
    const body = await request.json();
    const { storeId, creatorId = 'user-creator', amount, creatorProfileCpf, nonce, expiresAt, serverSignature, clientSignature } = body;

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

    // Validação de Segurança Mandatória: Garantir que o usuário requisitante é o dono (creatorId)
    let isAuthenticatedAndAuthorized = false;
    let validJwt = '';
    
    // 1. Tentar primeiro o Header Authorization explícito (O cliente assina o payload com este JWT exato)
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      validJwt = authHeader.substring(7);
      try {
        const { data: userData } = await supabaseAdmin.auth.getUser(validJwt);
        if (userData?.user && userData.user.id === creatorId) {
          isAuthenticatedAndAuthorized = true;
        }
      } catch (e) {}
    }

    // 2. Fallback para a sessão SSR atual do Supabase
    if (!isAuthenticatedAndAuthorized) {
      const user = await getRequestUser(request);
      if (user && user.id === creatorId) {
        isAuthenticatedAndAuthorized = true;
      }
    }

    const { data: ownedStore } = await supabaseAdmin.from('stores').select('creator_id').eq('id', storeId).maybeSingle();
    if (!ownedStore || ownedStore.creator_id !== creatorId) {
      return NextResponse.json({ success: false, error: 'A loja informada não pertence ao criador autenticado.' }, { status: 403 });
    }

    if (!isAuthenticatedAndAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado. Autenticação inválida para esta operação financeira.' },
        { status: 401 }
      );
    }

    // Anti-Tampering do Payload (Verifica se ninguém interceptou o proxy e mudou o valor)
    if (!verifyClientPayloadSignature(Number(amount), storeId, nonce, validJwt, clientSignature)) {
       return NextResponse.json({ success: false, error: 'Assinatura do payload inválida. Possível adulteração na requisição detectada.' }, { status: 403 });
    }
    // Executa solicitação no servidor e reserva o saldo para análise manual.
    const withdrawal = await requestCreatorWithdrawal({
      storeId,
      creatorId,
      amount: Number(amount),
      creatorProfileCpf
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
