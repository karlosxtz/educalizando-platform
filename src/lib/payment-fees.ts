export type PlatformPaymentMethod = 'pix' | 'credit_card' | 'debit_card';

export const PIX_PLATFORM_FEE_PERCENTAGE = 13;
export const CARD_PLATFORM_FEE_PERCENTAGE = 18.99;

export function normalizePlatformPaymentMethod(value: unknown): PlatformPaymentMethod {
  const method = String(value || '').trim().toLowerCase();
  if (['credit_card', 'credit', 'credito', 'cartao', 'card'].includes(method)) return 'credit_card';
  if (['debit_card', 'debit', 'debito'].includes(method)) return 'debit_card';
  return 'pix';
}

export function getPlatformFeePercentage(method: unknown): number {
  return normalizePlatformPaymentMethod(method) === 'pix'
    ? PIX_PLATFORM_FEE_PERCENTAGE
    : CARD_PLATFORM_FEE_PERCENTAGE;
}

export function calculatePlatformFee(amount: number, method: unknown): number {
  const gross = Math.max(0, Number(amount) || 0);
  return Number((gross * getPlatformFeePercentage(method) / 100).toFixed(2));
}

export function assertSingleInstallmentPayment(method: unknown, installments: unknown): void {
  const normalizedMethod = normalizePlatformPaymentMethod(method);
  const installmentCount = Number(installments || 1);
  if (normalizedMethod !== 'pix' && installmentCount !== 1) {
    throw new Error('card_installments_not_allowed');
  }
}

export function isSingleInstallmentPayment(method: unknown, installments: unknown): boolean {
  try {
    assertSingleInstallmentPayment(method, installments);
    return true;
  } catch {
    return false;
  }
}
