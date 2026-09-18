import { supabaseAdmin } from './supabase';

export type WhatsAppTemplateKey =
  | 'creatorWelcome'
  | 'studentWelcome'
  | 'affiliateWelcome'
  | 'creatorSale'
  | 'buyerSale';

const TEMPLATE_COLUMNS: Record<WhatsAppTemplateKey, string> = {
  creatorWelcome: 'whatsapp_template_creator',
  studentWelcome: 'whatsapp_template_student',
  affiliateWelcome: 'whatsapp_template_affiliate',
  creatorSale: 'whatsapp_template_creator_sale',
  buyerSale: 'whatsapp_template_buyer_sale',
};

const DEFAULT_TEMPLATES: Record<WhatsAppTemplateKey, string> = {
  creatorWelcome: 'Olá {{nome}}! 👋\n\nQue alegria ter você na Educalizando! Sua loja acaba de nascer.\n\nAcesse seu painel para publicar seus materiais: https://www.educalizando.com.br/dashboard\n\nConte com a gente! 💙',
  studentWelcome: 'Olá {{nome}}! 👋\n\nSeja bem-vindo(a) à Educalizando! Aqui você encontra materiais prontos para transformar suas aulas.\n\nExplore o acervo: https://www.educalizando.com.br/buscar',
  affiliateWelcome: 'Olá {{nome}}! 👋\n\nSeja bem-vindo(a) ao programa de Afiliados Educalizando!\n\nAcesse sua área para gerar links e acompanhar suas indicações: https://www.educalizando.com.br/dashboard/afiliacoes',
  creatorSale: '💰 Nova venda confirmada!\n\nOlá, {{nome}}! {{comprador}} comprou {{produto}}.\n\nValor líquido: {{valor}}\nPedido: #{{pedido}}\n\nAcompanhe no seu painel: https://www.educalizando.com.br/dashboard/pedidos',
  buyerSale: '✅ Compra confirmada!\n\nOlá, {{nome}}! Seu pagamento foi aprovado.\n\nMaterial(is): {{produto}}\nTotal: {{valor}}\n\nSeus materiais já estão disponíveis em: https://www.educalizando.com.br/cliente/dashboard',
};

export function normalizeWhatsAppNumber(phone: unknown): string | null {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return null;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  if (digits.length === 12 || digits.length === 13) return digits;
  return null;
}

function readEvolutionError(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (Array.isArray(value)) {
    const messages = value.map(readEvolutionError).filter((message): message is string => Boolean(message));
    return messages.length ? messages.join(' ') : null;
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return readEvolutionError(record.message) || readEvolutionError(record.error) || JSON.stringify(record);
  }
  return null;
}

export function firstName(value: string | null | undefined, fallback = 'Educador(a)') {
  return value?.trim().split(/\s+/)[0] || fallback;
}

export function renderWhatsAppTemplate(template: string, variables: Record<string, string | number | null | undefined>) {
  return template.replace(/\{\{([a-z_]+)\}\}/gi, (_, key: string) => String(variables[key] ?? ''));
}

export async function getWhatsAppTemplate(key: WhatsAppTemplateKey): Promise<string> {
  const column = TEMPLATE_COLUMNS[key];
  try {
    const { data, error } = await supabaseAdmin
      .from('platform_settings')
      .select(column)
      .limit(1)
      .maybeSingle();

    const settings = data as Record<string, unknown> | null;
    const configuredTemplate = settings?.[column];
    if (!error && typeof configuredTemplate === 'string' && configuredTemplate.trim()) {
      return configuredTemplate.trim();
    }
  } catch (error) {
    console.warn('[WhatsApp] Não foi possível carregar template configurado.', error);
  }
  return DEFAULT_TEMPLATES[key];
}

export async function sendEvolutionText(phone: unknown, text: string): Promise<{ sent: boolean; reason?: string; error?: string }> {
  const number = normalizeWhatsAppNumber(phone);
  if (!number) return { sent: false, reason: 'invalid_phone', error: 'Informe um WhatsApp brasileiro válido, com DDD.' };

  const apiKey = process.env.EVOLUTION_API_KEY;
  const baseUrl = (process.env.EVOLUTION_API_BASE_URL || 'https://evolutionapi.vps11334.panel.icontainer.net').replace(/\/$/, '');
  const instanceName = process.env.EVOLUTION_INSTANCE_NAME || 'educalizando';
  if (!apiKey || !instanceName) {
    console.warn('[WhatsApp] Evolution API não configurada. Defina EVOLUTION_API_KEY e EVOLUTION_INSTANCE_NAME.');
    return { sent: false, reason: 'not_configured', error: 'A Evolution não está configurada no ambiente.' };
  }

  try {
    const response = await fetch(`${baseUrl}/message/sendText/${encodeURIComponent(instanceName)}`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', apikey: apiKey },
      body: JSON.stringify({ number, text }),
      cache: 'no-store',
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null) as { message?: unknown; error?: unknown; response?: unknown } | null;
      const remoteMessage = readEvolutionError(body?.response) || readEvolutionError(body?.message) || readEvolutionError(body?.error);
      const error = remoteMessage
        ? remoteMessage.slice(0, 500)
        : `A Evolution recusou o envio (status ${response.status}).`;
      console.error(`[WhatsApp] Evolution respondeu com status ${response.status}: ${error}`);
      return { sent: false, reason: `http_${response.status}`, error };
    }
    return { sent: true };
  } catch (error) {
    console.error('[WhatsApp] Falha de rede ao enviar mensagem pela Evolution.', error);
    return { sent: false, reason: 'network_error', error: 'Não foi possível alcançar a Evolution para enviar a mensagem.' };
  }
}

function evolutionConfig() {
  const apiKey = process.env.EVOLUTION_API_KEY;
  const baseUrl = (process.env.EVOLUTION_API_BASE_URL || 'https://evolutionapi.vps11334.panel.icontainer.net').replace(/\/$/, '');
  const instanceName = process.env.EVOLUTION_INSTANCE_NAME || 'educalizando';
  return { apiKey, baseUrl, instanceName };
}

export type EvolutionInstanceHealth = {
  configured: boolean;
  connected: boolean;
  state: string;
  instanceName: string | null;
  server: string | null;
  checkedAt: string;
  error?: string;
};

export async function getEvolutionInstanceHealth(): Promise<EvolutionInstanceHealth> {
  const { apiKey, baseUrl, instanceName } = evolutionConfig();
  const checkedAt = new Date().toISOString();
  if (!apiKey || !instanceName) {
    return { configured: false, connected: false, state: 'not_configured', instanceName: null, server: null, checkedAt };
  }

  try {
    const response = await fetch(`${baseUrl}/instance/connectionState/${encodeURIComponent(instanceName)}`, {
      headers: { apikey: apiKey },
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));
    const state = String(data?.instance?.state || data?.instance?.status || 'unknown').toLowerCase();
    if (!response.ok) {
      return { configured: true, connected: false, state: 'unavailable', instanceName, server: new URL(baseUrl).host, checkedAt, error: `A Evolution respondeu com status ${response.status}.` };
    }
    return { configured: true, connected: state === 'open', state, instanceName, server: new URL(baseUrl).host, checkedAt };
  } catch {
    return { configured: true, connected: false, state: 'unreachable', instanceName, server: null, checkedAt, error: 'Não foi possível consultar o servidor da Evolution.' };
  }
}

export async function logoutEvolutionInstance(): Promise<{ disconnected: boolean; error?: string }> {
  const { apiKey, baseUrl, instanceName } = evolutionConfig();
  if (!apiKey || !instanceName) return { disconnected: false, error: 'A Evolution não está configurada.' };

  try {
    const response = await fetch(`${baseUrl}/instance/logout/${encodeURIComponent(instanceName)}`, {
      method: 'DELETE',
      headers: { apikey: apiKey },
    });
    if (!response.ok) return { disconnected: false, error: `A Evolution respondeu com status ${response.status}.` };
    return { disconnected: true };
  } catch {
    return { disconnected: false, error: 'Não foi possível desconectar a instância.' };
  }
}
