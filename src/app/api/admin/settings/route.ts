import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isSuperAdmin } from '@/lib/api-auth';

function validMoney(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 && amount <= 100000 ? amount : null;
}

function optionalTemplate(value: unknown) {
  return typeof value === 'string' ? value.trim().slice(0, 2000) : '';
}

export async function GET(request: Request) {
  try {
    if (!(await isSuperAdmin(request))) {
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
    if (!(await isSuperAdmin(request))) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();
    const minimumWithdrawalAmount = validMoney(body.minimum_withdrawal_amount);
    const withdrawalFee = validMoney(body.withdrawal_fee);
    if (minimumWithdrawalAmount === null || withdrawalFee === null) {
      return NextResponse.json({ error: 'Informe valores válidos entre R$ 0,00 e R$ 100.000,00.' }, { status: 400 });
    }
    const whatsappTemplateCreator = optionalTemplate(body.whatsapp_template_creator);
    const whatsappTemplateStudent = optionalTemplate(body.whatsapp_template_student);
    const whatsappTemplateAffiliate = optionalTemplate(body.whatsapp_template_affiliate);

    const { data: existing } = await supabaseAdmin.from('platform_settings').select('id').limit(1).single();

    let result;
    if (existing) {
      result = await supabaseAdmin
        .from('platform_settings')
        .update({
          platform_fee_percentage: 13,
          platform_fixed_fee: 0,
          minimum_withdrawal_amount: minimumWithdrawalAmount,
          withdrawal_fee: withdrawalFee,
          whatsapp_template_creator: whatsappTemplateCreator,
          whatsapp_template_student: whatsappTemplateStudent,
          whatsapp_template_affiliate: whatsappTemplateAffiliate,
          updated_at: new Date().toISOString(),
          updated_by: 'SuperAdmin'
        })
        .eq('id', existing.id);
    } else {
      result = await supabaseAdmin
        .from('platform_settings')
        .insert([{
          platform_fee_percentage: 13,
          platform_fixed_fee: 0,
          minimum_withdrawal_amount: minimumWithdrawalAmount,
          withdrawal_fee: withdrawalFee,
          whatsapp_template_creator: whatsappTemplateCreator,
          whatsapp_template_student: whatsappTemplateStudent,
          whatsapp_template_affiliate: whatsappTemplateAffiliate,
          updated_by: 'SuperAdmin'
        }]);
    }

    if (result.error) throw result.error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
