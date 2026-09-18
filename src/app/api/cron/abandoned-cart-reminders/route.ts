import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendEvolutionText } from '@/lib/whatsapp-notification-service';

export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const { data: reminders, error } = await supabaseAdmin.from('abandoned_cart_reminders').select('id, customer_name, phone_e164, store_slug, recovery_token, cart_items, total_amount, order_id').eq('status', 'pending').lte('send_after', new Date().toISOString()).limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  let sent = 0;
  for (const reminder of reminders || []) {
    if (reminder.order_id) {
      const { data: order } = await supabaseAdmin.from('orders').select('status').eq('id', reminder.order_id).maybeSingle();
      if (order?.status === 'paid') { await supabaseAdmin.from('abandoned_cart_reminders').update({ status: 'purchased', updated_at: new Date().toISOString() }).eq('id', reminder.id); continue; }
    }
    const items = Array.isArray(reminder.cart_items) ? reminder.cart_items : [];
    const names = items.slice(0, 2).map((item: any) => item.title).join(', ');
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).replace(/\/$/, '');
    const link = `${appUrl}/recuperar-carrinho/${reminder.recovery_token}`;
    const result = await sendEvolutionText(reminder.phone_e164, `Olá${reminder.customer_name ? `, ${reminder.customer_name.split(' ')[0]}` : ''}! Seus materiais${names ? ` (${names})` : ''} continuam no carrinho. Finalize sua compra com segurança: ${link}`);
    if (result.sent) { await supabaseAdmin.from('abandoned_cart_reminders').update({ status: 'sent', sent_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', reminder.id); sent++; }
  }
  return NextResponse.json({ success: true, processed: reminders?.length || 0, sent });
}
