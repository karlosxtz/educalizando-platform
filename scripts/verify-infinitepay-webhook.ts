import assert from 'node:assert/strict';
import {
  assertConfirmedInfinitePayPayment,
  InfinitePayWebhookValidationError,
  getWebhookOrderAction,
  MAX_INFINITEPAY_WEBHOOK_BYTES,
  parseInfinitePayWebhook,
} from '../src/lib/infinitepay-webhook';

const validRaw = JSON.stringify({
  order_nsu: 'ord_idem_abcdefghijklmnopqrstuvwxyz1234567890',
  transaction_nsu: 'transaction_abcdefghijklmnopqrstuvwxyz123',
  invoice_slug: 'invoice_abcdefghijklmnopqrstuvwxyz123456',
  amount: 1990,
  paid_amount: 1990,
  capture_method: 'pix',
  currency: 'BRL',
});
const validPayload = parseInfinitePayWebhook(validRaw);
const confirmedPayment = {
  paid: true,
  amountInCents: 1990,
  paidAmountInCents: 1990,
  captureMethod: 'pix',
  currency: 'BRL',
  orderNsu: validPayload.orderNsu,
  transactionNsu: validPayload.transactionNsu,
  invoiceSlug: validPayload.invoiceSlug,
};

assert.doesNotThrow(() => assertConfirmedInfinitePayPayment(validPayload, confirmedPayment, 1990));
for (const raw of ['', '{', '[]', JSON.stringify({ ...JSON.parse(validRaw), amount: '1990' }), JSON.stringify({ ...JSON.parse(validRaw), currency: 'USD' })]) {
  assert.throws(() => parseInfinitePayWebhook(raw), InfinitePayWebhookValidationError);
}
assert.throws(() => parseInfinitePayWebhook(JSON.stringify({ ...JSON.parse(validRaw), transaction_nsu: 123 })), InfinitePayWebhookValidationError);
assert.throws(() => parseInfinitePayWebhook('x'.repeat(MAX_INFINITEPAY_WEBHOOK_BYTES + 1)), InfinitePayWebhookValidationError);
assert.throws(() => assertConfirmedInfinitePayPayment(validPayload, { ...confirmedPayment, paid: false }, 1990), InfinitePayWebhookValidationError);
assert.throws(() => assertConfirmedInfinitePayPayment(validPayload, { ...confirmedPayment, amountInCents: 2000 }, 1990), InfinitePayWebhookValidationError);
assert.throws(() => assertConfirmedInfinitePayPayment(validPayload, { ...confirmedPayment, transactionNsu: 'transaction_other_abcdefghijklmnopqrstuvwxyz123' }, 1990), InfinitePayWebhookValidationError);
assert.equal(getWebhookOrderAction('pending', null, validPayload.transactionNsu), 'process');
assert.equal(getWebhookOrderAction('pending', validPayload.transactionNsu, validPayload.transactionNsu), 'process');
assert.equal(getWebhookOrderAction('pending', 'transaction_other_abcdefghijklmnopqrstuvwxyz123', validPayload.transactionNsu), 'reject');
assert.equal(getWebhookOrderAction('paid', validPayload.transactionNsu, validPayload.transactionNsu), 'duplicate');
assert.equal(getWebhookOrderAction('paid', null, validPayload.transactionNsu), 'reject');
assert.equal(getWebhookOrderAction('refunded', validPayload.transactionNsu, validPayload.transactionNsu), 'reject');

console.log('InfinitePay webhook validation passed without external payment calls.');
