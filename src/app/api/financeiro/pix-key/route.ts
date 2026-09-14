import { NextResponse } from 'next/server';
import { registerCreatorPixKey, getActiveCreatorPixKey } from '@/lib/withdrawal-service';
import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';

async function userOwnsStore(storeId: string, userId: string) {
  const { data } = await supabaseAdmin
    .from('stores')
    .select('id')
    .eq('id', storeId)
    .eq('creator_id', userId)
    .maybeSingle();

  return Boolean(data);
}

export async function GET(request: Request) {
  try {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ success: false, error: 'Não autorizado.' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json({ success: false, error: 'Identificador da loja (storeId) é obrigatório.' }, { status: 400 });
    }

    if (!(await userOwnsStore(storeId, user.id))) {
      return NextResponse.json({ success: false, error: 'Loja não encontrada ou sem permissão.' }, { status: 403 });
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
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ success: false, error: 'Não autorizado.' }, { status: 401 });

    const body = await request.json();
    const { storeId, inputPixKey } = body;

    if (!storeId) {
      return NextResponse.json(
        { success: false, error: 'Identificador da loja (storeId) é obrigatório.' },
        { status: 400 }
      );
    }


    if (!(await userOwnsStore(storeId, user.id))) {
      return NextResponse.json({ success: false, error: 'Loja não encontrada ou sem permissão.' }, { status: 403 });
    }

    const creatorProfileCpf = String(user.user_metadata?.cpf || '').replace(/\D/g, '');
    const holderName = user.user_metadata?.full_name || user.user_metadata?.name || undefined;

    if (!inputPixKey || !creatorProfileCpf) {
      return NextResponse.json(
        { success: false, error: 'Cadastre um CPF válido no seu perfil antes de informar a chave PIX.' },
        { status: 400 }
      );
    }

    // Executa cadastro e validação de titularidade no SERVIDOR
    const registeredKey = await registerCreatorPixKey({
      storeId,
      creatorId: user.id,
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
