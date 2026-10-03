import { isSuperAdmin } from '@/lib/api-auth';
import { resolveCreatorWhatsAppAccess } from '@/lib/creator-whatsapp-access';
import { supabaseAdmin } from '@/lib/supabase';
import { logoutEvolutionInstanceByName } from '@/lib/whatsapp-notification-service';
import { NextResponse } from 'next/server';

function validMoney(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 && amount <= 100000 ? amount : null;
}

function validWhatsappPrice(value: unknown) {
  const amount = Number(value);
  return Number.isInteger(amount) && amount >= 100 && amount <= 1000000 ? amount : null;
}

async function disconnectStoresWithoutAccess() {
  const { data: subscriptions, error } = await supabaseAdmin
    .from('whatsapp_store_subscriptions')
    .select('id,store_id,instance_name,whatsapp_connected');
  if (error) throw error;
  const connected = (subscriptions || []).filter(item => item.whatsapp_connected && item.instance_name);
  await Promise.allSettled(connected.map(async (subscription) => {
    const access = await resolveCreatorWhatsAppAccess(subscription.store_id);
    if (access.active) return;
    await logoutEvolutionInstanceByName(subscription.instance_name);
    await supabaseAdmin
      .from('whatsapp_store_subscriptions')
      .update({ whatsapp_connected: false, updated_at: new Date().toISOString() })
      .eq('id', subscription.id);
  }));
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
    const whatsappPriceCents = validWhatsappPrice(body.whatsapp_module_price_cents);
    if (minimumWithdrawalAmount === null || withdrawalFee === null) {
      return NextResponse.json({ error: 'Informe valores válidos entre R$ 0,00 e R$ 100.000,00.' }, { status: 400 });
    }
    if (typeof body.whatsapp_module_charge_enabled !== 'boolean' || whatsappPriceCents === null) {
      return NextResponse.json({ error: 'Revise a cobrança e o preço do módulo WhatsApp.' }, { status: 400 });
    }
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
          whatsapp_module_charge_enabled: body.whatsapp_module_charge_enabled,
          whatsapp_module_price_cents: whatsappPriceCents,
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
          whatsapp_module_charge_enabled: body.whatsapp_module_charge_enabled,
          whatsapp_module_price_cents: whatsappPriceCents,
          updated_by: 'SuperAdmin'
        }]);
    }

    if (result.error) throw result.error;

    if (body.whatsapp_module_charge_enabled) await disconnectStoresWithoutAccess();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
