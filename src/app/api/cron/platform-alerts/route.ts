import { isRealSupabaseConfigured,supabaseAdmin } from '@/lib/supabase';
import { getEvolutionInstanceHealth,sendEvolutionText } from '@/lib/whatsapp-notification-service';
import { checkObjectStorageHealth } from '@/lib/object-storage';
import { NextResponse } from 'next/server';
import { sendOperationalAlertEmail } from '@/lib/mail-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const failures: string[] = [];
  const database = isRealSupabaseConfigured() ? await supabaseAdmin.from('stores').select('id', { head: true, count: 'exact' }).limit(1) : { error: { message: 'Supabase não configurado' } };
  if (database.error) failures.push('Supabase indisponível');
  const whatsapp = await getEvolutionInstanceHealth();
  if (!whatsapp.configured || !whatsapp.connected) failures.push('Evolution API desconectada');
  const { data: deliveries } = await supabaseAdmin.from('transactional_delivery_attempts').select('id').in('status', ['FAILED', 'PROCESSING']).gte('last_attempt_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()).limit(20);
  if (deliveries?.length) failures.push(`${deliveries.length} entrega(s) transacional(is) com falha ou presa(s)`);
  try { await checkObjectStorageHealth(); } catch { failures.push('MinIO indisponível'); }
  const { count: checkoutFailures } = await supabaseAdmin.from('operational_events').select('id', { head: true, count: 'exact' }).eq('service', 'checkout').gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());
  if (checkoutFailures) failures.push(`${checkoutFailures} falha(s) no checkout na última hora`);

  const alertPhone = String(process.env.ADMIN_ALERT_WHATSAPP || '').replace(/\D/g, '');
  let notified = false;
  if (failures.length && alertPhone) notified = (await sendEvolutionText(alertPhone, `🚨 Alerta operacional Educalizando\n\n${failures.map(item => `• ${item}`).join('\n')}\n\nVerifique o painel de operação.`)).sent;
  if (failures.length && process.env.ADMIN_ALERT_EMAIL) notified = (await sendOperationalAlertEmail(process.env.ADMIN_ALERT_EMAIL, failures)).sent || notified;
  return NextResponse.json({ success: failures.length === 0, failures, notified }, { status: failures.length ? 503 : 200 });
}
