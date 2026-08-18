import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAffiliateProfile } from '@/lib/affiliate-service';
import { getActiveCreatorPixKey, registerCreatorPixKey } from '@/lib/withdrawal-service';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Token inválido ou expirado' }, { status: 401 });
    }

    const affiliateStore = await getAffiliateProfile(user.id);
    if (!affiliateStore) {
      return NextResponse.json({ success: false, error: 'Perfil de afiliado não encontrado' }, { status: 404 });
    }

    const { data: storeData } = await supabaseAdmin
      .from('stores')
      .select('id')
      .eq('creator_id', user.id)
      .single();

    if (!storeData) {
      return NextResponse.json({ success: false, error: 'Loja base do afiliado não encontrada' }, { status: 404 });
    }

    // Procura chave PIX atrelada à loja base do afiliado
    const activeKey = await getActiveCreatorPixKey(storeData.id);

    return NextResponse.json({
      success: true,
      pixKey: activeKey ? {
        id: activeKey.id,
        pixKeyMasked: activeKey.pixKeyMasked,
        status: activeKey.validationStatus
      } : null
    });

  } catch (error: any) {
    console.error('[GET /api/affiliates/pix-keys] Erro:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Token inválido' }, { status: 401 });
    }

    const body = await req.json();
    const { pixKey } = body;

    if (!pixKey) {
      return NextResponse.json({ success: false, error: 'Chave PIX não informada.' }, { status: 400 });
    }

    const userProfileCpf = user.user_metadata?.cpf || '00000000000'; // Fallback
    
    const { data: storeData } = await supabaseAdmin
      .from('stores')
      .select('id')
      .eq('creator_id', user.id)
      .single();

    if (!storeData) {
      return NextResponse.json({ success: false, error: 'Erro de integridade do afiliado (loja não encontrada)' }, { status: 400 });
    }

    // A função registerCreatorPixKey valida se o CPF confere e bate no Asaas
    const newKey = await registerCreatorPixKey({
      storeId: storeData.id,
      creatorId: user.id,
      creatorProfileCpf: userProfileCpf,
      inputPixKey: pixKey
    });

    return NextResponse.json({
      success: true,
      message: 'Chave PIX cadastrada e validada com sucesso.',
      pixKey: {
        id: newKey.id,
        pixKeyMasked: newKey.pixKeyMasked,
        status: newKey.validationStatus
      }
    });

  } catch (error: any) {
    console.error('[POST /api/affiliates/pix-keys] Erro:', error);
    return NextResponse.json({ success: false, error: error.message || 'Erro ao cadastrar chave PIX.' }, { status: 400 });
  }
}
