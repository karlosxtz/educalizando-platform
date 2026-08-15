import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

async function checkSuperAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('sb-access-token')?.value;
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const superAdminEmail = process.env.SUPERADMIN_EMAIL || 'rafinhaagathathamy@gmail.com';
    return payload.email === superAdminEmail;
  } catch (e) {
    return false;
  }
}

export async function GET() {
  try {
    if (!(await checkSuperAdmin())) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { data: settings, error } = await supabaseAdmin
      .from('platform_settings')
      .select('*')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is not found

    return NextResponse.json({ success: true, settings: settings || null });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await checkSuperAdmin())) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();
    const { platform_fee_percentage, platform_fixed_fee, minimum_withdrawal_amount, withdrawal_fee } = body;

    const { data: existing } = await supabaseAdmin.from('platform_settings').select('id').limit(1).single();

    let result;
    if (existing) {
      result = await supabaseAdmin
        .from('platform_settings')
        .update({
          platform_fee_percentage,
          platform_fixed_fee,
          minimum_withdrawal_amount,
          withdrawal_fee,
          updated_at: new Date().toISOString(),
          updated_by: 'SuperAdmin'
        })
        .eq('id', existing.id);
    } else {
      result = await supabaseAdmin
        .from('platform_settings')
        .insert([{
          platform_fee_percentage,
          platform_fixed_fee,
          minimum_withdrawal_amount,
          withdrawal_fee,
          updated_by: 'SuperAdmin'
        }]);
    }

    if (result.error) throw result.error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
