import { calculatePlatformFee, getPlatformFeePercentage, type PlatformPaymentMethod } from './payment-fees';

export type ExclusiveMaterialStatus = 'open' | 'negotiating' | 'awaiting_payment' | 'paid' | 'in_production' | 'delivered' | 'cancelled' | 'rejected';

export const EXCLUSIVE_MATERIAL_STATUS_LABEL: Record<ExclusiveMaterialStatus, string> = {
  open: 'Nova solicitação', negotiating: 'Em negociação', awaiting_payment: 'Aguardando pagamento',
  paid: 'Pagamento confirmado', in_production: 'Em produção', delivered: 'Finalizada com sucesso',
  cancelled: 'Cancelada', rejected: 'Recusada'
};

export function exclusiveFinancials(amount: number, paymentMethod: PlatformPaymentMethod = 'pix') {
  const grossAmount = Number(amount.toFixed(2));
  const platformFeeAmount = calculatePlatformFee(grossAmount, paymentMethod);
  return {
    grossAmount,
    platformFeePercentage: getPlatformFeePercentage(paymentMethod),
    platformFeeAmount,
    creatorNetAmount: Number((grossAmount - platformFeeAmount).toFixed(2))
  };
}
