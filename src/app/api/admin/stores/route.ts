import { isSuperAdmin } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  try {
    if (!(await isSuperAdmin(request))) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { data: stores, error } = await supabaseAdmin
      .from('stores')
      .select('*, products(count)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, stores });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!(await isSuperAdmin(request))) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('id');

    if (!storeId) {
      return NextResponse.json({ error: 'ID da loja obrigatório' }, { status: 400 });
    }
    if (!UUID_PATTERN.test(storeId)) {
      return NextResponse.json({ error: 'ID da loja inválido' }, { status: 400 });
    }

    // Uma exclusão em cascata destruiria catálogo, pedidos e acessos. A loja
    // só pode ser apagada quando ainda não possui operação vinculada.
    const [
      { count: productsCount, error: productsError },
      { count: kitsCount, error: kitsError },
      { count: purchasesCount, error: purchasesError },
      { data: storeReferrals, error: referralsError },
      { data: referralCodes, error: referralCodesError },
    ] = await Promise.all([
      supabaseAdmin.from('products').select('id', { count: 'exact', head: true }).eq('store_id', storeId),
      supabaseAdmin.from('kits').select('id', { count: 'exact', head: true }).eq('store_id', storeId),
      supabaseAdmin.from('purchases').select('id', { count: 'exact', head: true }).eq('store_id', storeId),
      supabaseAdmin
        .from('creator_referrals')
        .select('id, referral_code_id')
        .or(`referrer_store_id.eq.${storeId},referred_store_id.eq.${storeId}`),
      supabaseAdmin.from('creator_referral_codes').select('id').eq('store_id', storeId),
    ]);
    if (productsError || kitsError || purchasesError || referralsError || referralCodesError) {
      throw productsError || kitsError || purchasesError || referralsError || referralCodesError;
    }
    if (productsCount || kitsCount || purchasesCount) {
      return NextResponse.json({
        error: `Esta loja possui ${productsCount || 0} produto(s), ${kitsCount || 0} kit(s) ou ${purchasesCount || 0} compra(s) vinculada(s). A exclusão foi bloqueada para preservar o histórico.`
      }, { status: 409 });
    }

    // Uma loja sem operações pode ter sido indicada por outro criador ou ter
    // um código de indicação. Esses vínculos não carregam valor financeiro por
    // si só, mas a FK impede a exclusão. Preservamos qualquer comissão já
    // gerada e limpamos somente relações sem comissão.
    const referralCodeIds = (referralCodes || []).map((code) => code.id);
    const { data: codeReferrals, error: codeReferralsError } = referralCodeIds.length
      ? await supabaseAdmin
        .from('creator_referrals')
        .select('id')
        .in('referral_code_id', referralCodeIds)
      : { data: [], error: null };
    if (codeReferralsError) throw codeReferralsError;

    const referralIds = [...new Set([
      ...(storeReferrals || []).map((referral) => referral.id),
      ...(codeReferrals || []).map((referral) => referral.id),
    ])];

    if (referralIds.length) {
      const { count: commissionsCount, error: commissionsError } = await supabaseAdmin
        .from('creator_referral_commissions')
        .select('id', { count: 'exact', head: true })
        .in('referral_id', referralIds);
      if (commissionsError) throw commissionsError;
      if (commissionsCount) {
        return NextResponse.json({
          error: 'Esta loja possui indicações com comissão gerada. A exclusão foi bloqueada para preservar o histórico financeiro.',
        }, { status: 409 });
      }

      const { error: deleteReferralsError } = await supabaseAdmin
        .from('creator_referrals')
        .delete()
        .in('id', referralIds);
      if (deleteReferralsError) throw deleteReferralsError;
    }

    if (referralCodeIds.length) {
      const { error: deleteCodesError } = await supabaseAdmin
        .from('creator_referral_codes')
        .delete()
        .in('id', referralCodeIds);
      if (deleteCodesError) throw deleteCodesError;
    }

    const { error } = await supabaseAdmin
      .from('stores')
      .delete()
      .eq('id', storeId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
