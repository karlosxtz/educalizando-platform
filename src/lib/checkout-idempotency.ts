import crypto from 'crypto';

export type CheckoutAttemptItem = {
  productId: string;
  quantity: number;
  unitPrice: number;
};

export type CheckoutAttempt = {
  studentId: string;
  storeId: string;
  isPlrPurchase: boolean;
  couponId: string | null;
  items: CheckoutAttemptItem[];
};

const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9_-]{32,128}$/;

export function isValidCheckoutIdempotencyKey(value: string): boolean {
  return IDEMPOTENCY_KEY_PATTERN.test(value);
}

// The opaque browser key is never persisted. Its HMAC becomes the orders.id,
// allowing the existing primary-key constraint to reserve one attempt atomically.
export function createCheckoutOrderId(idempotencyKey: string, serverSecret: string): string {
  if (!isValidCheckoutIdempotencyKey(idempotencyKey)) {
    throw new Error('Chave de idempotência inválida.');
  }

  const digest = crypto
    .createHmac('sha256', serverSecret)
    .update(`checkout-attempt:${idempotencyKey}`)
    .digest('hex');

  return `ord_idem_${digest.slice(0, 48)}`;
}

function normalizedItems(items: CheckoutAttemptItem[]) {
  return [...items]
    .map((item) => ({
      productId: String(item.productId),
      quantity: Number(item.quantity),
      unitPriceInCents: Math.round(Number(item.unitPrice) * 100),
    }))
    .sort((left, right) => left.productId.localeCompare(right.productId));
}

export function checkoutAttemptMatches(existing: CheckoutAttempt, expected: CheckoutAttempt): boolean {
  if (
    existing.studentId !== expected.studentId ||
    existing.storeId !== expected.storeId ||
    existing.isPlrPurchase !== expected.isPlrPurchase ||
    existing.couponId !== expected.couponId
  ) {
    return false;
  }

  const existingItems = normalizedItems(existing.items);
  const expectedItems = normalizedItems(expected.items);
  return existingItems.length === expectedItems.length && existingItems.every((item, index) => (
    item.productId === expectedItems[index].productId &&
    item.quantity === expectedItems[index].quantity &&
    item.unitPriceInCents === expectedItems[index].unitPriceInCents
  ));
}
