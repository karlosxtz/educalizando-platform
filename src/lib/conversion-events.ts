export type ConversionStage = 'view' | 'cart' | 'checkout';
export type ConversionEvent = { storeId: string; productId: string; stage: ConversionStage };
export const isUuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export function cleanConversionBatch(value: unknown): { sessionId: string; events: ConversionEvent[] } | null {
  if (!value || typeof value !== 'object') return null;
  const input = value as { sessionId?: unknown; events?: unknown; consent?: unknown };
  if (input.consent !== true || !isUuid(input.sessionId) || !Array.isArray(input.events) || !input.events.length || input.events.length > 20) return null;
  const events: ConversionEvent[] = [];
  for (const item of input.events) {
    if (!item || !isUuid(item.storeId) || !isUuid(item.productId) || !['view', 'cart', 'checkout'].includes(item.stage)) return null;
    if (!events.some(event => event.storeId === item.storeId && event.productId === item.productId && event.stage === item.stage)) events.push({ storeId: item.storeId, productId: item.productId, stage: item.stage });
  }
  return { sessionId: input.sessionId, events };
}
