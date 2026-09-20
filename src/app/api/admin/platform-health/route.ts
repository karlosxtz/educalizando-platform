import { NextResponse } from 'next/server';
import { isSuperAdmin } from '@/lib/api-auth';
import { getMailConfiguration } from '@/lib/mail-service';
import { isRealSupabaseConfigured, supabaseAdmin } from '@/lib/supabase';
import { getEvolutionInstanceHealth } from '@/lib/whatsapp-notification-service';

export const dynamic = 'force-dynamic';

type HealthStatus = 'healthy' | 'warning' | 'error';
type ServiceHealth = { id: string; label: string; status: HealthStatus; message: string; href?: string };

const failedDeliveryStatuses = new Set(['FAILED', 'PROCESSING']);

export async function GET(request: Request) {
  if (!(await isSuperAdmin(request))) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });

  const checkedAt = new Date().toISOString();
  const [databaseCheck, mail, whatsapp, deliveryCheck] = await Promise.all([
    isRealSupabaseConfigured()
      ? supabaseAdmin.from('stores').select('id', { head: true, count: 'exact' }).limit(1)
      : Promise.resolve({ error: { message: 'Supabase não configurado.' } }),
    getMailConfiguration(),
    getEvolutionInstanceHealth(),
    supabaseAdmin
      .from('transactional_delivery_attempts')
      .select('status, last_attempt_at')
      .gte('last_attempt_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(200),
  ]);

  const services: ServiceHealth[] = [];
  services.push(
    databaseCheck.error
      ? { id: 'database', label: 'Supabase e banco de dados', status: 'error', message: 'A plataforma não conseguiu consultar o banco de dados.', href: '/admin/configuracoes' }
      : { id: 'database', label: 'Supabase e banco de dados', status: 'healthy', message: 'Conexão com o banco confirmada.', href: '/admin/configuracoes' },
  );

  const emailStatus: HealthStatus = !mail.configured || mail.domainStatus === 'not_found' ? 'error' : mail.domainStatus === 'verified' ? 'healthy' : 'warning';
  const emailMessage = !mail.configured
    ? 'A chave da Resend não está configurada.'
    : mail.domainStatus === 'verified'
      ? `Domínio ${mail.domain || 'de envio'} verificado na Resend.`
      : `Domínio de envio aguardando confirmação (${mail.domainStatus}).`;
  services.push({ id: 'email', label: 'Resend e e-mail', status: emailStatus, message: emailMessage, href: '/admin/emails' });

  services.push({
    id: 'whatsapp',
    label: 'Evolution e WhatsApp principal',
    status: !whatsapp.configured ? 'warning' : whatsapp.connected ? 'healthy' : 'error',
    message: !whatsapp.configured ? 'A instância principal ainda não foi configurada.' : whatsapp.connected ? 'Instância principal conectada e pronta para notificações.' : 'A instância principal está desconectada ou indisponível.',
    href: '/admin/whatsapp',
  });

  const paymentConfigured = Boolean(process.env.INFINITEPAY_HANDLE?.trim());
  services.push({
    id: 'payments',
    label: 'InfinitePay e checkout',
    status: paymentConfigured ? 'healthy' : 'warning',
    message: paymentConfigured ? 'Handle de produção configurada. A confirmação final continua sendo feita pelos webhooks.' : 'A variável INFINITEPAY_HANDLE não foi configurada no ambiente.',
    href: '/admin/configuracoes',
  });

  if (deliveryCheck.error) {
    services.push({ id: 'deliveries', label: 'Fila de entregas', status: 'warning', message: 'Não foi possível ler a fila. Confirme se a migration de entregas foi aplicada.', href: '/admin/entregas' });
  } else {
    const deliveries = deliveryCheck.data || [];
    const pending = deliveries.filter(item => failedDeliveryStatuses.has(String(item.status).toUpperCase())).length;
    services.push({
      id: 'deliveries',
      label: 'Entregas transacionais',
      status: pending ? 'warning' : 'healthy',
      message: pending ? `${pending} envio(s) com falha ou em processamento nas últimas 24 horas.` : 'Nenhuma falha ou entrega pendente registrada nas últimas 24 horas.',
      href: '/admin/entregas',
    });
  }

  return NextResponse.json({ checkedAt, services });
}
