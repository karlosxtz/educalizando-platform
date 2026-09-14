import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getRequestUser } from '@/lib/api-auth';
export async function GET(request: Request) {
  if (!(await getRequestUser(request))) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const { data } = await supabaseAdmin.from('platform_settings').select('minimum_withdrawal_amount, withdrawal_fee').limit(1).maybeSingle();
  return NextResponse.json({ minimumWithdrawalAmount: Number(data?.minimum_withdrawal_amount ?? 0), withdrawalFee: Number(data?.withdrawal_fee ?? 0) });
}
