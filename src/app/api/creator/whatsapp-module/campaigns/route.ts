import { getRequestUser } from '@/lib/api-auth';
import {
isCreatorWhatsAppCampaignPresetId,
renderCreatorWhatsAppCampaignMessage,
type CreatorWhatsAppCampaignPresetId,
} from '@/lib/creator-whatsapp-campaigns';
import { supabaseAdmin } from '@/lib/supabase';
import { normalizeWhatsAppNumber,sendEvolutionImage,sendEvolutionText } from '@/lib/whatsapp-notification-service';
import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';

export const runtime = 'nodejs';
export const maxDuration = 300;

const PAID_STATUSES = new Set(['paid', 'pago', 'liberado', 'aprovado', 'concluido']);
const MAX_RECIPIENTS = 500;

type Store = {
  id: string;
  nome_loja: string;
  slug: string;
  exclusive_material_requests_enabled: boolean;
};

type CampaignCustomer = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  phoneLabel: string;
  purchases: number;
  spent: number;
  lastPurchaseAt: string | null;
};

type CampaignProduct = {
  id: string;
  title: string;
  slug: string;
  price: number;
  coverUrl: string | null;
};

function recipientId(identity: string) {
  return createHash('sha256').update(identity).digest('hex').slice(0, 24);
}

function readablePhone(phone: string | null) {
  if (!phone) return 'WhatsApp não cadastrado';
  const national = phone.startsWith('55') ? phone.slice(2) : phone;
  if (national.length < 10) return 'WhatsApp inválido';
  return `(${national.slice(0, 2)}) *****-${national.slice(-4)}`;
}

function numberValue(value: unknown) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

async function creatorContext(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return null;
  const { data: store } = await supabaseAdmin
    .from('stores')
    .select('id,nome_loja,slug,exclusive_material_requests_enabled')
    .eq('creator_id', user.id)
    .maybeSingle();
  if (!store) return null;
  const { data: subscription } = await supabaseAdmin
    .from('whatsapp_store_subscriptions')
    .select('status,expires_at,instance_name,whatsapp_connected')
    .eq('store_id', store.id)
    .maybeSingle();
  const active = Boolean(subscription?.status === 'active' && subscription.expires_at && new Date(subscription.expires_at) > new Date());
  return { user, store: store as Store, subscription, active };
}

async function getCustomers(storeId: string): Promise<CampaignCustomer[]> {
  const { data: orders, error } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
    .limit(5000);
  if (error) throw new Error(error.message);

  const grouped = new Map<string, CampaignCustomer>();
  for (const raw of orders || []) {
    const order = raw as Record<string, unknown>;
    if (order.is_plr_purchase === true || !PAID_STATUSES.has(String(order.status || '').toLowerCase())) continue;
    const email = String(order.cliente_email || order.buyer_email || '').trim().toLowerCase();
    const phone = normalizeWhatsAppNumber(order.cliente_telefone || order.buyer_phone);
    const identity = email ? `email:${email}` : phone ? `phone:${phone}` : '';
    if (!identity) continue;
    const createdAt = typeof order.created_at === 'string' ? order.created_at : null;
    const existing = grouped.get(identity);
    if (!existing) {
      grouped.set(identity, {
        id: recipientId(identity),
        name: String(order.cliente_nome || order.buyer_name || email.split('@')[0] || 'Cliente').trim(),
        email,
        phone,
        phoneLabel: readablePhone(phone),
        purchases: 1,
        spent: numberValue(order.valor_total || order.total_amount || order.amount),
        lastPurchaseAt: createdAt,
      });
      continue;
    }
    existing.purchases += 1;
    existing.spent += numberValue(order.valor_total || order.total_amount || order.amount);
    if (!existing.phone && phone) {
      existing.phone = phone;
      existing.phoneLabel = readablePhone(phone);
    }
    if (createdAt && (!existing.lastPurchaseAt || new Date(createdAt) > new Date(existing.lastPurchaseAt))) existing.lastPurchaseAt = createdAt;
  }
  return [...grouped.values()].sort((a, b) => (b.lastPurchaseAt || '').localeCompare(a.lastPurchaseAt || ''));
}

async function getProducts(storeId: string): Promise<CampaignProduct[]> {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('id,titulo,slug,preco,capa_url')
    .eq('store_id', storeId)
    .eq('status', 'publicado')
    .is('excluido_em', null)
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  return (data || []).map((product) => ({
    id: product.id,
    title: product.titulo,
    slug: product.slug,
    price: numberValue(product.preco),
    coverUrl: product.capa_url || null,
  }));
}

function parseIds(value: unknown) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id): id is string => typeof id === 'string' && /^[a-f0-9]{24}$/.test(id)))].slice(0, MAX_RECIPIENTS);
}

function campaignLink(origin: string, store: Store, presetId: CreatorWhatsAppCampaignPresetId, product?: CampaignProduct) {
  if (presetId === 'product' && product) return `${origin}/loja/${store.slug}/produto/${product.slug || product.id}`;
  if (presetId === 'exclusive') return `${origin}/solicitar-material-exclusivo/${store.slug}`;
  return `${origin}/loja/${store.slug}`;
}

function formatPrice(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

async function pause(milliseconds: number) {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function GET(request: Request) {
  try {
    const context = await creatorContext(request);
    if (!context) return NextResponse.json({ error: 'Faça login como criador para acessar este módulo.' }, { status: 401 });
    if (!context.active) return NextResponse.json({ error: 'Ative o módulo WhatsApp da Loja para usar a central de campanhas.' }, { status: 403 });
    const [customers, products] = await Promise.all([getCustomers(context.store.id), getProducts(context.store.id)]);
    return NextResponse.json({
      success: true,
      store: {
        name: context.store.nome_loja,
        slug: context.store.slug,
        acceptsExclusive: context.store.exclusive_material_requests_enabled,
      },
      connected: Boolean(context.subscription?.whatsapp_connected),
      customers: customers.map(({ phone, ...customer }) => ({ ...customer, hasWhatsapp: Boolean(phone) })),
      products,
      summary: {
        total: customers.length,
        available: customers.filter((customer) => customer.phone).length,
        unavailable: customers.filter((customer) => !customer.phone).length,
      },
    });
  } catch (error) {
    console.error('[Creator WhatsApp Campaigns] Falha ao carregar:', error);
    return NextResponse.json({ error: 'Não foi possível carregar seus clientes e materiais agora.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const context = await creatorContext(request);
    if (!context) return NextResponse.json({ error: 'Faça login como criador para enviar mensagens.' }, { status: 401 });
    if (!context.active || !context.subscription?.whatsapp_connected || !context.subscription.instance_name) {
      return NextResponse.json({ error: 'Conecte o WhatsApp da sua loja antes de enviar mensagens.' }, { status: 403 });
    }

    const body = await request.json() as Record<string, unknown>;
    const presetId: CreatorWhatsAppCampaignPresetId = isCreatorWhatsAppCampaignPresetId(body.presetId) ? body.presetId : 'promotion';
    const text = typeof body.text === 'string' ? body.text.trim().slice(0, 3000) : '';
    const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim().slice(0, 2000) : '';
    const customerIds = parseIds(body.customerIds);
    const productId = typeof body.productId === 'string' ? body.productId : '';
    if (!text) return NextResponse.json({ error: 'Escreva a mensagem que será enviada.' }, { status: 400 });
    if (!customerIds.length) return NextResponse.json({ error: 'Selecione pelo menos um cliente.' }, { status: 400 });
    if (imageUrl && !/^https:\/\//i.test(imageUrl)) return NextResponse.json({ error: 'A imagem anexada precisa possuir uma URL HTTPS válida.' }, { status: 400 });
    if (presetId === 'exclusive' && !context.store.exclusive_material_requests_enabled) {
      return NextResponse.json({ error: 'Ative as solicitações de materiais exclusivos antes de enviar este convite.' }, { status: 400 });
    }

    const [customers, products] = await Promise.all([getCustomers(context.store.id), getProducts(context.store.id)]);
    const product = productId ? products.find((item) => item.id === productId) : undefined;
    if (presetId === 'product' && !product) return NextResponse.json({ error: 'Selecione um produto publicado da sua loja.' }, { status: 400 });
    const selected = new Set(customerIds);
    const eligible = customers.filter((customer) => selected.has(customer.id) && customer.phone);
    const uniqueRecipients = [...new Map(eligible.map((customer) => [customer.phone, customer])).values()];
    if (!uniqueRecipients.length) return NextResponse.json({ error: 'Nenhum cliente selecionado possui um WhatsApp válido.' }, { status: 400 });

    const origin = new URL(request.url).origin;
    const link = campaignLink(origin, context.store, presetId, product);
    const failures: Array<{ id: string; name: string; error: string }> = [];
    let sent = 0;
    for (let offset = 0; offset < uniqueRecipients.length; offset += 5) {
      const batch = uniqueRecipients.slice(offset, offset + 5);
      const results = await Promise.all(batch.map(async (customer) => {
        const message = renderCreatorWhatsAppCampaignMessage(text, {
          customerName: customer.name || 'Cliente',
          storeName: context.store.nome_loja,
          productName: product?.title,
          productPrice: product ? formatPrice(product.price) : null,
          link,
        });
        const result = imageUrl
          ? await sendEvolutionImage(customer.phone, imageUrl, message, context.subscription!.instance_name)
          : await sendEvolutionText(customer.phone, message, context.subscription!.instance_name);
        return { customer, result };
      }));
      for (const { customer, result } of results) {
        if (result.sent) sent += 1;
        else failures.push({ id: customer.id, name: customer.name, error: result.error || 'Falha não identificada.' });
      }
      if (offset + 5 < uniqueRecipients.length) await pause(500);
    }

    return NextResponse.json({
      success: failures.length === 0,
      result: {
        requested: customerIds.length,
        eligible: uniqueRecipients.length,
        sent,
        failed: failures.length,
        skipped: customerIds.length - eligible.length,
        duplicates: eligible.length - uniqueRecipients.length,
        failures: failures.slice(0, 50),
      },
    }, { status: failures.length === uniqueRecipients.length ? 503 : 200 });
  } catch (error) {
    console.error('[Creator WhatsApp Campaigns] Falha no envio:', error);
    return NextResponse.json({ error: 'Não foi possível concluir o envio agora.' }, { status: 500 });
  }
}

