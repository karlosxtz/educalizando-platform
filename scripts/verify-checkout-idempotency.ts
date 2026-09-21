import assert from 'node:assert/strict';
import {
  checkoutAttemptMatches,
  createCheckoutOrderId,
  isValidCheckoutIdempotencyKey,
  type CheckoutAttempt,
} from '../src/lib/checkout-idempotency';

const key = 'v7d2Xg5Lq1a9M3c8K4n6R0p2S5t7W9yB';
const secret = 'test-server-crypto-secret-for-unit-tests-only-123456';
const baseAttempt: CheckoutAttempt = {
  studentId: 'user-a',
  storeId: 'store-a',
  isPlrPurchase: false,
  couponId: null,
  items: [{ productId: 'product-a', quantity: 1, unitPrice: 19.9 }],
};

assert.equal(isValidCheckoutIdempotencyKey(key), true);
assert.equal(isValidCheckoutIdempotencyKey('invalid'), false);
assert.equal(createCheckoutOrderId(key, secret), createCheckoutOrderId(key, secret));
assert.notEqual(createCheckoutOrderId(key, secret), createCheckoutOrderId(`${key}x`, secret));

async function run() {
  const concurrentReservations = await Promise.all(Array.from({ length: 20 }, () => Promise.resolve(createCheckoutOrderId(key, secret))));
  assert.equal(new Set(concurrentReservations).size, 1, 'Requisições simultâneas devem disputar a mesma reserva do banco.');
  assert.equal(checkoutAttemptMatches(baseAttempt, { ...baseAttempt, items: [...baseAttempt.items] }), true);
  assert.equal(checkoutAttemptMatches(baseAttempt, { ...baseAttempt, studentId: 'user-b' }), false);
  assert.equal(checkoutAttemptMatches(baseAttempt, { ...baseAttempt, storeId: 'store-b' }), false);
  assert.equal(checkoutAttemptMatches(baseAttempt, { ...baseAttempt, isPlrPurchase: true }), false);
  assert.equal(checkoutAttemptMatches(baseAttempt, { ...baseAttempt, couponId: 'coupon-a' }), false);
  assert.equal(checkoutAttemptMatches(baseAttempt, { ...baseAttempt, items: [{ productId: 'product-b', quantity: 1, unitPrice: 19.9 }] }), false);
  assert.equal(checkoutAttemptMatches(baseAttempt, { ...baseAttempt, items: [{ productId: 'product-a', quantity: 2, unitPrice: 19.9 }] }), false);
  assert.equal(checkoutAttemptMatches(baseAttempt, { ...baseAttempt, items: [{ productId: 'product-a', quantity: 1, unitPrice: 24.9 }] }), false);

  console.log('Checkout idempotency validation passed without external payment calls.');
}

void run();
