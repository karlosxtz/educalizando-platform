import { NextResponse } from 'next/server';
import { registerCreatorPixKey, getActiveCreatorPixKey } from '@/lib/withdrawal-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json({ success: false, error: 'Identificador da loja (storeId) é obrigatório.' }, { status: 400 });
    }

    const activeKey = await getActiveCreatorPixKey(storeId);
    return NextResponse.json({
      success: true,
      hasKey: !!activeKey,
      pixKey: activeKey ? {
        id: activeKey.id,
        pixKeyMasked: activeKey.pixKeyMasked,
        holderName: activeKey.holderName,
        validationStatus: activeKey.validationStatus,
        validatedAt: activeKey.validatedAt
      } : null
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { storeId, creatorId = 'user-creator', creatorProfileCpf, inputPixKey, holderName } = body;

    if (!storeId) {
      return NextResponse.json(
        { success: false, error: 'Identificador da loja (storeId) é obrigatório.' },
        { status: 400 }
      );
    }

    if (!inputPixKey || !creatorProfileCpf) {
      return NextResponse.json(
        { success: false, error: 'Por favor, informe a chave PIX CPF e seu CPF cadastrado na conta.' },
        { status: 400 }
      );
    }

    // Executa cadastro e validação de titularidade no SERVIDOR
    const registeredKey = await registerCreatorPixKey({
      storeId,
      creatorId,
      creatorProfileCpf,
      inputPixKey,
      holderName
    });

    return NextResponse.json({
      success: true,
      message: 'Chave PIX CPF validada e cadastrada com sucesso!',
      pixKey: {
        id: registeredKey.id,
        pixKeyMasked: registeredKey.pixKeyMasked,
        holderName: registeredKey.holderName,
        validationStatus: registeredKey.validationStatus,
        validatedAt: registeredKey.validatedAt
      }
    });

  } catch (err: any) {
    console.error('[API PIX Key Error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Erro ao validar e cadastrar a chave PIX.' },
      { status: 400 }
    );
  }
}
