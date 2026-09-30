export type PlatformPaymentMethod = 'pix' | 'credit_card' | 'debit_card';

export const PLATFORM_FEE_PERCENTAGE = 13;
export const PIX_PLATFORM_FEE_PERCENTAGE = PLATFORM_FEE_PERCENTAGE;
export const MAX_CARD_INSTALLMENTS = 12;

/** Juros informados pela InfinitePay e cobrados do cliente em cada parcelamento. */
export const CARD_PROCESSING_FEE_PERCENTAGES = {
  1: 5.99, 2: 11.39, 3: 12.49, 4: 13.09, 5: 13.79, 6: 14.49,
  7: 15.49, 8: 16.09, 9: 16.69, 10: 17.39, 11: 18.39, 12: 18.79,
} as const satisfies Record<number, number>;

export type CardInstallmentCount = keyof typeof CARD_PROCESSING_FEE_PERCENTAGES;

export function normalizePlatformPaymentMethod(value: unknown): PlatformPaymentMethod {
  const method = String(value || '').trim().toLowerCase();
  if (['credit_card', 'credit', 'credito', 'cartao', 'card'].includes(method)) return 'credit_card';
  if (['debit_card', 'debit', 'debito'].includes(method)) return 'debit_card';
  return 'pix';
}

export function normalizeInstallmentCount(value: unknown): number {
  if (value === undefined || value === null || value === '') return 1;
  const installments = Number(value);
  return Number.isSafeInteger(installments) ? installments : 0;
}

/** A taxa comercial da Educalizando é sempre 13%, independentemente do meio. */
export function getPlatformFeePercentage(_method?: unknown): number {
  return PLATFORM_FEE_PERCENTAGE;
}

export function getPaymentProcessingFeePercentage(method: unknown, installments: unknown = 1): number {
  const normalizedMethod = normalizePlatformPaymentMethod(method);
  if (normalizedMethod === 'pix') return 0;
  const count = normalizedMethod === 'debit_card' ? 1 : normalizeInstallmentCount(installments);
  return CARD_PROCESSING_FEE_PERCENTAGES[count as CardInstallmentCount] ?? 0;
}

export function getTotalFeePercentage(method: unknown, installments: unknown = 1): number {
  return Number((PLATFORM_FEE_PERCENTAGE + getPaymentProcessingFeePercentage(method, installments)).toFixed(2));
}

export function calculatePlatformFee(amount: number, _method?: unknown): number {
  const gross = Math.max(0, Number(amount) || 0);
  return Number((gross * PLATFORM_FEE_PERCENTAGE / 100).toFixed(2));
}

export function calculatePaymentProcessingFee(amount: number, method: unknown, installments: unknown = 1): number {
  // Valor informativo pago pelo cliente; não deve ser abatido da carteira.
  const gross = Math.max(0, Number(amount) || 0);
  return Number((gross * getPaymentProcessingFeePercentage(method, installments) / 100).toFixed(2));
}

export function assertSupportedInstallmentPayment(method: unknown, installments: unknown): void {
  const normalizedMethod = normalizePlatformPaymentMethod(method);
  const count = normalizeInstallmentCount(installments);
  const valid = normalizedMethod === 'credit_card'
    ? count >= 1 && count <= MAX_CARD_INSTALLMENTS
    : count === 1;
  if (!valid) throw new Error('payment_installments_not_allowed');
}

export function isSupportedInstallmentPayment(method: unknown, installments: unknown): boolean {
  try {
    assertSupportedInstallmentPayment(method, installments);
    return true;
  } catch {
    return false;
  }
}

// Compatibilidade com chamadas antigas enquanto o nome é removido gradualmente.
export const assertSingleInstallmentPayment = assertSupportedInstallmentPayment;
export const isSingleInstallmentPayment = isSupportedInstallmentPayment;
