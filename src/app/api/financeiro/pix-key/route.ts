import { NextResponse } from 'next/server';
import { registerCreatorPixKey, getActiveCreatorPixKey } from '@/lib/withdrawal-service';
import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';

// A chave PIX muda durante a sessão. Nunca reutilize uma resposta antiga nesta rota.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ success: false, error: 'Não autorizado.' }, { status: 401 });

    const body = await request.json();
    const { storeId, inputPixKey, holderName: requestedHolderName, bankName } = body;

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
    const holderName = String(requestedHolderName || user.user_metadata?.full_name || user.user_metadata?.name || '').trim() || undefined;

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

    if (bankName?.trim()) {
      await supabaseAdmin.from('creator_pix_keys').update({ bank_name: String(bankName).trim() }).eq('id', registeredKey.id);
    }

    // A confirmação exibida ao criador só pode acontecer após uma nova leitura
    // do banco. Isso evita sucesso visual com chave apenas em memória/localStorage.
    const persistedKey = await getActiveCreatorPixKey(storeId);
    if (!persistedKey || persistedKey.id !== registeredKey.id || persistedKey.validationStatus !== 'VALID') {
      throw new Error('A chave PIX não foi confirmada no banco de dados. Verifique a integração do Supabase e tente novamente.');
    }

    return NextResponse.json({
      success: true,
      message: 'Chave PIX CPF validada e cadastrada com sucesso!',
      pixKey: {
        id: persistedKey.id,
        pixKeyMasked: persistedKey.pixKeyMasked,
        holderName: persistedKey.holderName,
        bankName: bankName?.trim() || null,
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
