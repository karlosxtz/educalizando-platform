import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAffiliateAvailableBalance, requestAffiliateWithdrawal } from '@/lib/affiliate-service';
import { getRequestUser } from '@/lib/api-auth';

export async function GET(req: Request) {
  try {
    const user = await getRequestUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Token inválido ou expirado' }, { status: 401 });
    }

    const userId = user.id;

    // 1. Obter Saldo Disponível via Wallet Transactions
    const availableBalance = await getAffiliateAvailableBalance(userId);

    // 2. Obter Histórico de Saques do Afiliado
    const { data: withdrawals, error: wError } = await supabaseAdmin
      .from('withdrawals')
      .select('*')
      .eq('creator_id', userId)
      .order('requested_at', { ascending: false });

    if (wError) {
      console.error('[GET /api/affiliates/withdrawals] Erro ao buscar saques:', wError);
      return NextResponse.json({ success: false, error: 'Erro ao buscar histórico de saques' }, { status: 500 });
    }

    // 3. Totais
    const totalWithdrawn = withdrawals
      ?.filter(w => w.status === 'COMPLETED')
      .reduce((sum, w) => sum + Number(w.amount), 0) || 0;

    const totalPending = withdrawals
      ?.filter(w => w.status === 'PENDING' || w.status === 'PROCESSING')
      .reduce((sum, w) => sum + Number(w.amount), 0) || 0;

    return NextResponse.json({
      success: true,
      balance: {
        available: availableBalance,
        withdrawn: totalWithdrawn,
        pending: totalPending
      },
      history: withdrawals?.map(w => ({
        id: w.id,
        amount: Number(w.amount),
        status: w.status,
        requestedAt: w.requested_at,
        completedAt: w.completed_at,
        failedAt: w.failed_at,
        pixKeyMasked: w.pix_key_masked,
        failureReason: w.failure_reason
      })) || []
    });

  } catch (error: any) {
    console.error('[GET /api/affiliates/withdrawals] Erro:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getRequestUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Token inválido' }, { status: 401 });
    }

    const body = await req.json();
    const { amount } = body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Valor de saque inválido.' }, { status: 400 });
    }

    // Obter CPF do perfil do usuário para garantir validação de titularidade da chave PIX
    const userProfileCpf = String(user.user_metadata?.cpf || '').replace(/\D/g, '');
    if (userProfileCpf.length !== 11) {
      return NextResponse.json({ success: false, error: 'Cadastre um CPF válido no seu perfil antes de solicitar o saque.' }, { status: 400 });
    }
    
    // Iniciar o processo seguro de saque
    const result = await requestAffiliateWithdrawal({
      userId: user.id,
      amount: Number(amount),
      userProfileCpf
    });

    return NextResponse.json({
      success: true,
      message: 'Saque solicitado com sucesso!',
      withdrawalId: result.withdrawalId
    });

  } catch (error: any) {
    console.error('[POST /api/affiliates/withdrawals] Erro:', error);
    return NextResponse.json({ success: false, error: error.message || 'Erro interno ao processar saque.' }, { status: 400 });
  }
}
