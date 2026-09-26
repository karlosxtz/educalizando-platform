import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/api-auth';
import { attributeCreatorReferral, getCreatorReferralDashboard } from '@/lib/creator-referral-service';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const { data: store } = await supabaseAdmin.from('stores').select('id').eq('creator_id', user.id).maybeSingle();
  if (!store) return NextResponse.json({ error: 'Conta de criador não encontrada.' }, { status: 403 });
  const dashboard = await getCreatorReferralDashboard(user.id, store.id);
  return NextResponse.json({ success: true, ...dashboard });
}

export async function POST(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const referralCode = typeof body.referralCode === 'string' ? body.referralCode : '';
  const result = await attributeCreatorReferral(user.id, referralCode);
  return NextResponse.json({ success: true, ...result });
}
