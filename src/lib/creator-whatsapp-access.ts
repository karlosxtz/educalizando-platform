import 'server-only';

import { determineCreatorWhatsAppAccess,type CreatorWhatsAppAccessSource } from './creator-whatsapp-access-policy';
import { supabaseAdmin } from './supabase';

export { determineCreatorWhatsAppAccess } from './creator-whatsapp-access-policy';

export const DEFAULT_WHATSAPP_MODULE_PRICE_CENTS = 1990;

type SubscriptionRecord = Record<string, unknown> & {
  id?: string;
  store_id?: string;
  creator_id?: string;
  status?: string;
  expires_at?: string | null;
  instance_name?: string | null;
  whatsapp_connected?: boolean;
  free_access_enabled?: boolean;
};

export type CreatorWhatsAppAccess = {
  active: boolean;
  source: CreatorWhatsAppAccessSource;
  chargeEnabled: boolean;
  priceCents: number;
  paidActive: boolean;
  individualFree: boolean;
  subscription: SubscriptionRecord | null;
};

function positivePrice(value: unknown) {
  const price = Number(value);
  return Number.isInteger(price) && price >= 100 && price <= 1000000
    ? price
    : DEFAULT_WHATSAPP_MODULE_PRICE_CENTS;
}

export async function getWhatsAppModuleSettings() {
  const { data, error } = await supabaseAdmin
    .from('platform_settings')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  const settings = (data || {}) as Record<string, unknown>;
  return {
    chargeEnabled: settings.whatsapp_module_charge_enabled !== false,
    priceCents: positivePrice(settings.whatsapp_module_price_cents),
  };
}

export async function resolveCreatorWhatsAppAccess(storeId: string): Promise<CreatorWhatsAppAccess> {
  const [settings, subscriptionResult] = await Promise.all([
    getWhatsAppModuleSettings(),
    supabaseAdmin.from('whatsapp_store_subscriptions').select('*').eq('store_id', storeId).maybeSingle(),
  ]);
  if (subscriptionResult.error) throw subscriptionResult.error;

  const subscription = subscriptionResult.data as SubscriptionRecord | null;
  const decision = determineCreatorWhatsAppAccess({
    chargeEnabled: settings.chargeEnabled,
    freeAccessEnabled: subscription?.free_access_enabled,
    status: subscription?.status,
    expiresAt: subscription?.expires_at,
  });

  return {
    active: decision.active,
    source: decision.source,
    chargeEnabled: settings.chargeEnabled,
    priceCents: settings.priceCents,
    paidActive: decision.paidActive,
    individualFree: decision.individualFree,
    subscription,
  };
}

export function creatorWhatsAppInstanceName(store: { id: string; slug: string }) {
  return `${store.slug.replace(/[^a-z0-9-]/gi, '-').toLowerCase().slice(0, 36)}-${store.id.slice(0, 6)}`;
}

export async function ensureCreatorWhatsAppSubscription(input: {
  storeId: string;
  creatorId: string;
  slug: string;
  priceCents?: number;
}) {
  const { data: existing, error: readError } = await supabaseAdmin
    .from('whatsapp_store_subscriptions')
    .select('*')
    .eq('store_id', input.storeId)
    .maybeSingle();
  if (readError) throw readError;
  if (existing) {
    if (existing.instance_name) return existing as SubscriptionRecord;
    const { data, error } = await supabaseAdmin
      .from('whatsapp_store_subscriptions')
      .update({ instance_name: creatorWhatsAppInstanceName({ id: input.storeId, slug: input.slug }), updated_at: new Date().toISOString() })
      .eq('store_id', input.storeId)
      .select('*')
      .single();
    if (error) throw error;
    return data as SubscriptionRecord;
  }

  const { data, error } = await supabaseAdmin
    .from('whatsapp_store_subscriptions')
    .insert({
      store_id: input.storeId,
      creator_id: input.creatorId,
      status: 'inactive',
      amount_cents: input.priceCents || DEFAULT_WHATSAPP_MODULE_PRICE_CENTS,
      instance_name: creatorWhatsAppInstanceName({ id: input.storeId, slug: input.slug }),
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as SubscriptionRecord;
}
