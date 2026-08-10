import { NextResponse } from 'next/server';
import { requestCreatorWithdrawal, getWithdrawalsHistory } from '@/lib/withdrawal-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId') || 'store-demo';

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
    const { storeId = 'store-demo', creatorId = 'user-demo', amount, creatorProfileCpf } = body;

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

    // Executa solicitação de saque no SERVIDOR (Reserva de saldo + Transferência Asaas)
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
        asaasTransferId: withdrawal.asaasTransferId,
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
