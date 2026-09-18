import { NextResponse } from 'next/server';
import { formatCatalogSearchReply, searchStoreCatalog } from '@/lib/whatsapp-catalog-search';
import { supabaseAdmin } from '@/lib/supabase';
import { sendEvolutionText } from '@/lib/whatsapp-notification-service';

export const runtime = 'nodejs';

type RecordValue = Record<string, unknown>;

function object(value: unknown): RecordValue {
  return value && typeof value === 'object' ? value as RecordValue : {};
}

/** Supports the common Evolution v2 messages.upsert payload without trusting its shape. */
function readIncomingMessage(payload: RecordValue) {
  const data = object(payload.data);
  const key = object(data.key);
  const message = object(data.message);
  const extended = object(message.extendedTextMessage);
  const text = [message.conversation, extended.text, object(message.imageMessage).caption, object(message.documentMessage).caption]
    .find(value => typeof value === 'string' && value.trim());
  const remoteJid = typeof key.remoteJid === 'string' ? key.remoteJid : '';
  const instanceName = typeof payload.instance === 'string'
    ? payload.instance
    : typeof payload.instanceName === 'string'
      ? payload.instanceName
      : typeof data.instance === 'string' ? data.instance : '';

  return {
    instanceName,
    text: typeof text === 'string' ? text.trim() : '',
    fromMe: key.fromMe === true,
    phone: remoteJid.endsWith('@s.whatsapp.net') ? remoteJid.replace(/@s\.whatsapp\.net$/, '') : '',
    isGroup: remoteJid.endsWith('@g.us'),
  };
}

function menuReply(storeName: string) {
  return `Olá! 👋 Sou o atendimento da ${storeName}.\n\nEscreva o tema, série, categoria ou data que procura — por exemplo: “folclore brasil 2026”.\n\nEu vou mostrar somente materiais reais desta loja.`;
}

export async function POST(request: Request) {
  try {
    const configuredSecret = process.env.EVOLUTION_WEBHOOK_SECRET;
    if (configuredSecret && request.headers.get('x-webhook-secret') !== configuredSecret) {
      return NextResponse.json({ received: false }, { status: 401 });
    }

    const payload = object(await request.json());
    const event = String(payload.event || '');
    if (event && !event.toLowerCase().includes('messages.upsert')) {
      return NextResponse.json({ received: true, ignored: 'event' });
    }

    const incoming = readIncomingMessage(payload);
    if (!incoming.instanceName || !incoming.phone || !incoming.text || incoming.fromMe || incoming.isGroup) {
      return NextResponse.json({ received: true, ignored: 'not_an_incoming_text' });
    }

    const { data: subscription, error } = await supabaseAdmin
      .from('whatsapp_store_subscriptions')
      .select('instance_name, expires_at, stores(id, nome_loja, slug)')
      .eq('instance_name', incoming.instanceName)
      .eq('status', 'active')
      .eq('whatsapp_connected', true)
      .maybeSingle();
    if (error) throw error;
    if (!subscription || (subscription.expires_at && new Date(subscription.expires_at) <= new Date())) {
      return NextResponse.json({ received: true, ignored: 'inactive_subscription' });
    }

    const store = Array.isArray(subscription.stores) ? subscription.stores[0] : subscription.stores;
    if (!store?.id) return NextResponse.json({ received: true, ignored: 'store_not_found' });

    const normalized = incoming.text.toLocaleLowerCase('pt-BR').trim();
    const response = /^(oi|ola|olá|menu|inicio|início|catalogo|catálogo)$/i.test(normalized)
      ? menuReply(store.nome_loja || 'esta loja')
      : formatCatalogSearchReply(incoming.text, await searchStoreCatalog(store.id, incoming.text), store.slug);

    const delivery = await sendEvolutionText(incoming.phone, response, incoming.instanceName);
    if (!delivery.sent) throw new Error(delivery.error || 'A Evolution não aceitou a resposta automática.');

    return NextResponse.json({ received: true, replied: true });
  } catch (error) {
    console.error('[WhatsApp Store Webhook] Erro:', error);
    // Evolution deve receber um JSON de sucesso para evitar reenvios infinitos.
    return NextResponse.json({ received: true, replied: false });
  }
}
