export const MAX_INFINITEPAY_WEBHOOK_BYTES = 64 * 1024;

export type InfinitePayWebhookPayload = {
  orderNsu: string;
  transactionNsu: string;
  invoiceSlug: string;
  amountInCents: number;
  paidAmountInCents?: number;
  installments?: number;
  captureMethod?: 'pix' | 'credit_card';
  receiptUrl?: string;
  currency?: 'BRL';
};

export type InfinitePayConfirmedPayment = {
  paid: boolean;
  amountInCents: number;
  paidAmountInCents: number;
  captureMethod: string;
  currency?: string;
  orderNsu?: string;
  transactionNsu?: string;
  invoiceSlug?: string;
};

export type WebhookOrderAction = 'process' | 'duplicate' | 'reject';

export class InfinitePayWebhookValidationError extends Error {
  constructor(public readonly reason: string) {
    super('Webhook da InfinitePay inválido.');
    this.name = 'InfinitePayWebhookValidationError';
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredIdentifier(value: unknown, field: string): string {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{3,128}$/.test(value)) {
    throw new InfinitePayWebhookValidationError(`${field}_invalid`);
  }
  return value;
}

function optionalInteger(value: unknown, field: string, minimum = 0): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < minimum) {
    throw new InfinitePayWebhookValidationError(`${field}_invalid`);
  }
  return value;
}

export function parseInfinitePayWebhook(rawBody: string): InfinitePayWebhookPayload {
  if (!rawBody || Buffer.byteLength(rawBody, 'utf8') > MAX_INFINITEPAY_WEBHOOK_BYTES) {
    throw new InfinitePayWebhookValidationError('body_invalid');
  }

  let value: unknown;
  try {
    value = JSON.parse(rawBody);
  } catch {
    throw new InfinitePayWebhookValidationError('json_invalid');
  }
  if (!isObject(value)) throw new InfinitePayWebhookValidationError('payload_invalid');

  const rawInvoiceSlug = value.invoice_slug ?? value.slug;
  if (value.invoice_slug !== undefined && value.slug !== undefined && value.invoice_slug !== value.slug) {
    throw new InfinitePayWebhookValidationError('invoice_reference_invalid');
  }

  const amountInCents = optionalInteger(value.amount, 'amount');
  if (amountInCents === undefined) throw new InfinitePayWebhookValidationError('amount_missing');
  const paidAmountInCents = optionalInteger(value.paid_amount, 'paid_amount');
  const installments = optionalInteger(value.installments, 'installments', 1);
  if (value.capture_method !== undefined && value.capture_method !== 'pix' && value.capture_method !== 'credit_card') {
    throw new InfinitePayWebhookValidationError('capture_method_invalid');
  }
  if (value.currency !== undefined && value.currency !== 'BRL') {
    throw new InfinitePayWebhookValidationError('currency_invalid');
  }
  if (value.status !== undefined && (typeof value.status !== 'string' || !['PAID', 'APPROVED', 'CONFIRMED'].includes(value.status.toUpperCase()))) {
    throw new InfinitePayWebhookValidationError('status_invalid');
  }
  if (value.items !== undefined && (!Array.isArray(value.items) || value.items.length > 100 || !value.items.every(isObject))) {
    throw new InfinitePayWebhookValidationError('items_invalid');
  }

  let receiptUrl: string | undefined;
  if (value.receipt_url !== undefined) {
    if (typeof value.receipt_url !== 'string' || value.receipt_url.length > 2048 || !/^https:\/\//i.test(value.receipt_url)) {
      throw new InfinitePayWebhookValidationError('receipt_url_invalid');
    }
    receiptUrl = value.receipt_url;
  }

  return {
    orderNsu: requiredIdentifier(value.order_nsu, 'order_nsu'),
    transactionNsu: requiredIdentifier(value.transaction_nsu, 'transaction_nsu'),
    invoiceSlug: requiredIdentifier(rawInvoiceSlug, 'invoice_slug'),
    amountInCents,
    paidAmountInCents,
    installments,
    captureMethod: value.capture_method as InfinitePayWebhookPayload['captureMethod'],
    receiptUrl,
    currency: value.currency as InfinitePayWebhookPayload['currency'],
  };
}

export function assertConfirmedInfinitePayPayment(
  payload: InfinitePayWebhookPayload,
  payment: InfinitePayConfirmedPayment,
  expectedAmountInCents: number,
): void {
  if (!payment.paid || payment.amountInCents !== expectedAmountInCents || payload.amountInCents !== expectedAmountInCents) {
    throw new InfinitePayWebhookValidationError('payment_not_confirmed');
  }
  if (payment.currency !== undefined && payment.currency !== 'BRL') {
    throw new InfinitePayWebhookValidationError('provider_currency_invalid');
  }
  if (payment.captureMethod && !['pix', 'credit_card'].includes(payment.captureMethod)) {
    throw new InfinitePayWebhookValidationError('provider_capture_method_invalid');
  }
  if (
    (payment.orderNsu !== undefined && payment.orderNsu !== payload.orderNsu) ||
    (payment.transactionNsu !== undefined && payment.transactionNsu !== payload.transactionNsu) ||
    (payment.invoiceSlug !== undefined && payment.invoiceSlug !== payload.invoiceSlug)
  ) {
    throw new InfinitePayWebhookValidationError('provider_reference_invalid');
  }
}

export function getWebhookOrderAction(
  status: string,
  storedTransactionNsu: string | null | undefined,
  receivedTransactionNsu: string,
): WebhookOrderAction {
  if (status === 'pending') {
    return !storedTransactionNsu || storedTransactionNsu === receivedTransactionNsu ? 'process' : 'reject';
  }
  if (status === 'paid') {
    return storedTransactionNsu === receivedTransactionNsu ? 'duplicate' : 'reject';
  }
  return 'reject';
}
