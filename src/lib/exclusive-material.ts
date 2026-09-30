import { calculatePaymentProcessingFee, calculatePlatformFee, getPaymentProcessingFeePercentage, getPlatformFeePercentage, type PlatformPaymentMethod } from './payment-fees';

export type ExclusiveMaterialStatus = 'open' | 'negotiating' | 'awaiting_payment' | 'paid' | 'in_production' | 'delivered' | 'cancelled' | 'rejected';

export const EXCLUSIVE_MATERIAL_STATUS_LABEL: Record<ExclusiveMaterialStatus, string> = {
  open: 'Nova solicitação', negotiating: 'Em negociação', awaiting_payment: 'Aguardando pagamento',
  paid: 'Pagamento confirmado', in_production: 'Em produção', delivered: 'Finalizada com sucesso',
  cancelled: 'Cancelada', rejected: 'Recusada'
};

export function exclusiveFinancials(amount: number, paymentMethod: PlatformPaymentMethod = 'pix', installments = 1) {
  const grossAmount = Number(amount.toFixed(2));
  const platformFeeAmount = calculatePlatformFee(grossAmount, paymentMethod);
  const paymentProcessingFeeAmount = calculatePaymentProcessingFee(grossAmount, paymentMethod, installments);
  return {
    grossAmount,
    platformFeePercentage: getPlatformFeePercentage(paymentMethod),
    platformFeeAmount,
    paymentProcessingFeePercentage: getPaymentProcessingFeePercentage(paymentMethod, installments),
    paymentProcessingFeeAmount,
    totalFeePercentage: getPlatformFeePercentage(paymentMethod),
    // O parcelamento é pago pelo cliente no checkout. O criador arca somente
    // com os 13% da plataforma sobre o valor original da proposta.
    creatorNetAmount: Number(Math.max(0, grossAmount - platformFeeAmount).toFixed(2))
  };
}
