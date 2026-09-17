import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function PUT(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  try {
    const { storeId, enabled, commissionType, commissionRate } = await request.json();
    if (typeof storeId !== 'string' || !storeId) return NextResponse.json({ error: 'Loja inválida.' }, { status: 400 });
    if (commissionType !== 'percentual' && commissionType !== 'fixo') return NextResponse.json({ error: 'Tipo de comissão inválido.' }, { status: 400 });
    const rate = Number(commissionRate);
    const maximum = commissionType === 'percentual' ? 80 : 100000;
    if (!Number.isFinite(rate) || rate < 0 || rate > maximum || (Boolean(enabled) && rate <= 0)) {
      return NextResponse.json({ error: commissionType === 'percentual' ? 'A comissão percentual deve ficar entre 1% e 80%.' : 'Informe uma comissão fixa válida.' }, { status: 400 });
    }
    const { data, error } = await supabaseAdmin.from('stores').update({
      affiliate_program_enabled: Boolean(enabled), affiliate_commission_type: commissionType,
      affiliate_commission_rate: rate, updated_at: new Date().toISOString(),
    }).eq('id', storeId).eq('creator_id', user.id).select('id, affiliate_program_enabled, affiliate_commission_type, affiliate_commission_rate').maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Loja não encontrada ou sem permissão.' }, { status: 403 });
    return NextResponse.json({ success: true, store: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Não foi possível atualizar o programa de afiliados.' }, { status: 500 });
  }
}
