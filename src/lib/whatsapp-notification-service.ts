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
  buyerSale: '✅ Compra confirmada!\n\nOlá, {{nome}}! Seu pagamento foi aprovado.\n\nMaterial(is): {{produto}}\nTotal: {{valor}}',
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

export async function sendEvolutionText(phone: unknown, text: string, instanceOverride?: string): Promise<{ sent: boolean; reason?: string; error?: string }> {
  const number = normalizeWhatsAppNumber(phone);
  if (!number) return { sent: false, reason: 'invalid_phone', error: 'Informe um WhatsApp brasileiro válido, com DDD.' };

  const apiKey = process.env.EVOLUTION_API_KEY;
  const baseUrl = (process.env.EVOLUTION_API_BASE_URL || 'https://evolutionapi.vps11334.panel.icontainer.net').replace(/\/$/, '');
  const instanceName = instanceOverride || process.env.EVOLUTION_INSTANCE_NAME || 'educalizando';
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

/** Envia um documento já hospedado publicamente. Falhas não impedem a mensagem com o link seguro. */
export async function sendEvolutionDocument(phone: unknown, url: string, fileName: string, caption: string): Promise<{ sent: boolean; reason?: string; error?: string }> {
  const number = normalizeWhatsAppNumber(phone);
  if (!number) return { sent: false, reason: 'invalid_phone', error: 'Informe um WhatsApp brasileiro válido, com DDD.' };
  if (!/^https:\/\//i.test(url)) return { sent: false, reason: 'invalid_url', error: 'O arquivo não possui uma URL pública para envio.' };
  const { apiKey, baseUrl, instanceName } = evolutionConfig();
  if (!apiKey || !instanceName) return { sent: false, reason: 'not_configured', error: 'A Evolution não está configurada no ambiente.' };
  try {
    const response = await fetch(`${baseUrl}/message/sendMedia/${encodeURIComponent(instanceName)}`, {
      method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json', apikey: apiKey },
      body: JSON.stringify({ number, mediatype: 'document', media: url, fileName: fileName.slice(0, 120), caption }), cache: 'no-store',
    });
    if (!response.ok) return { sent: false, reason: `http_${response.status}`, error: `A Evolution recusou o documento (status ${response.status}).` };
    return { sent: true };
  } catch { return { sent: false, reason: 'network_error', error: 'Não foi possível enviar o documento pela Evolution.' }; }
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

export type EvolutionQrCode = {
  connected: boolean;
  created: boolean;
  qrCode: string | null;
  webhookConfigured?: boolean;
  error?: string;
};

function extractQrCode(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;
  const qrcode = record.qrcode && typeof record.qrcode === 'object' ? record.qrcode as Record<string, unknown> : null;
  const base64 = qrcode?.base64 || record.base64;
  return typeof base64 === 'string' && base64 ? base64 : null;
}

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

export async function restartEvolutionInstance(): Promise<{ restarted: boolean; error?: string }> {
  const { apiKey, baseUrl, instanceName } = evolutionConfig();
  if (!apiKey || !instanceName) return { restarted: false, error: 'A Evolution não está configurada.' };

  try {
    const response = await fetch(`${baseUrl}/instance/restart/${encodeURIComponent(instanceName)}`, {
      method: 'POST',
      headers: { apikey: apiKey },
      cache: 'no-store',
    });
    if (!response.ok) return { restarted: false, error: `A Evolution não conseguiu reiniciar a instância (status ${response.status}).` };
    return { restarted: true };
  } catch {
    return { restarted: false, error: 'Não foi possível reiniciar a instância.' };
  }
}

export async function getEvolutionConnectionQrCode(force = false, webhookUrl?: string): Promise<EvolutionQrCode> {
  const { apiKey, baseUrl, instanceName } = evolutionConfig();
  if (!apiKey || !instanceName) return { connected: false, created: false, qrCode: null, error: 'A Evolution não está configurada.' };
  return getEvolutionConnectionQrCodeForInstance(instanceName, force, webhookUrl);
}

/** Cria/conecta uma instância exclusiva de loja. O webhook é configurado antes do QR ser exibido. */
export async function getEvolutionConnectionQrCodeForInstance(instanceName: string, force = false, webhookUrl?: string): Promise<EvolutionQrCode> {
  const { apiKey, baseUrl } = evolutionConfig();
  if (!apiKey || !instanceName) return { connected: false, created: false, qrCode: null, error: 'A Evolution não está configurada.' };

  const headers = { Accept: 'application/json', 'Content-Type': 'application/json', apikey: apiKey };
  try {
    const stateResponse = await fetch(`${baseUrl}/instance/connectionState/${encodeURIComponent(instanceName)}`, { headers, cache: 'no-store' });
    const stateData = await stateResponse.json().catch(() => ({}));
    const state = String(stateData?.instance?.state || stateData?.instance?.status || '').toLowerCase();
    if (stateResponse.ok && state === 'open' && !force) {
      if (webhookUrl) {
        const configured = await configureEvolutionWebhook(baseUrl, apiKey, instanceName, webhookUrl);
        if (!configured) return { connected: true, created: false, qrCode: null, webhookConfigured: false, error: 'O WhatsApp está conectado, mas não foi possível registrar a automação.' };
      }
      return { connected: true, created: false, qrCode: null, webhookConfigured: Boolean(webhookUrl) };
    }

    if (force && stateResponse.ok) {
      const logoutResponse = await fetch(`${baseUrl}/instance/logout/${encodeURIComponent(instanceName)}`, {
        method: 'DELETE',
        headers,
        cache: 'no-store',
      });
      if (!logoutResponse.ok) return { connected: false, created: false, qrCode: null, error: `A Evolution não conseguiu preparar a nova conexão (status ${logoutResponse.status}).` };
    }

    let connectResponse = await fetch(`${baseUrl}/instance/connect/${encodeURIComponent(instanceName)}`, { headers, cache: 'no-store' });
    let data = await connectResponse.json().catch(() => ({}));
    let created = false;

    if (connectResponse.status === 404) {
      created = true;
      connectResponse = await fetch(`${baseUrl}/instance/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ instanceName, integration: 'WHATSAPP-BAILEYS', qrcode: true }),
        cache: 'no-store',
      });
      data = await connectResponse.json().catch(() => ({}));
    }

    if (!connectResponse.ok) {
      return { connected: false, created, qrCode: null, error: `A Evolution não gerou o QR Code (status ${connectResponse.status}).` };
    }

    const qrCode = extractQrCode(data);
    if (webhookUrl) {
      const configured = await configureEvolutionWebhook(baseUrl, apiKey, instanceName, webhookUrl);
      if (!configured) return { connected: false, created, qrCode: null, webhookConfigured: false, error: 'Não foi possível ativar o recebimento de mensagens desta loja. Tente gerar o QR Code novamente.' };
    }
    return { connected: false, created, qrCode, webhookConfigured: Boolean(webhookUrl), error: qrCode ? undefined : 'O QR Code está sendo preparado. Atualize em alguns segundos.' };
  } catch {
    return { connected: false, created: false, qrCode: null, error: 'Não foi possível gerar o QR Code da instância.' };
  }
}

async function configureEvolutionWebhook(baseUrl: string, apiKey: string, instanceName: string, webhookUrl: string) {
  try {
    const response = await fetch(`${baseUrl}/webhook/set/${encodeURIComponent(instanceName)}`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', apikey: apiKey },
      body: JSON.stringify({ webhook: { enabled: true, url: webhookUrl, webhook_by_events: false, events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE'] } }),
      cache: 'no-store',
    });
    if (!response.ok) console.error(`[WhatsApp] A Evolution recusou configurar webhook da instância ${instanceName} (${response.status}).`);
    return response.ok;
  } catch (error) {
    console.error('[WhatsApp] Não foi possível configurar webhook da instância.', error);
    return false;
  }
}
