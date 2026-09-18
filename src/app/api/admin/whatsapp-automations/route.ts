import { NextResponse } from 'next/server';
import { isSuperAdmin } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';

const TEMPLATE_FIELDS = [
  'whatsapp_template_creator',
  'whatsapp_template_student',
  'whatsapp_template_affiliate',
  'whatsapp_template_creator_sale',
  'whatsapp_template_buyer_sale',
] as const;

function templateValue(value: unknown) {
  return typeof value === 'string' ? value.trim().slice(0, 2000) : '';
}

export async function GET(request: Request) {
  if (!(await isSuperAdmin(request))) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });

  const { data, error } = await supabaseAdmin
    .from('platform_settings')
    .select(`id, ${TEMPLATE_FIELDS.join(', ')}`)
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    success: true,
    templates: data || {},
    integrationConfigured: Boolean(process.env.EVOLUTION_API_KEY && process.env.EVOLUTION_INSTANCE_NAME),
  });
}

export async function POST(request: Request) {
  if (!(await isSuperAdmin(request))) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });

  const body = await request.json();
  const updates = Object.fromEntries(TEMPLATE_FIELDS.map((field) => [field, templateValue(body[field])]));
  const { data: existing, error: existingError } = await supabaseAdmin
    .from('platform_settings')
    .select('id')
    .limit(1)
    .maybeSingle();
  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 });

  const result = existing
    ? await supabaseAdmin.from('platform_settings').update({ ...updates, updated_at: new Date().toISOString(), updated_by: 'SuperAdmin' }).eq('id', existing.id)
    : await supabaseAdmin.from('platform_settings').insert([{ ...updates, updated_by: 'SuperAdmin' }]);

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
