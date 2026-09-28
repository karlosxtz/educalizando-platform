export type ExclusiveMaterialStatus = 'open' | 'negotiating' | 'awaiting_payment' | 'paid' | 'in_production' | 'delivered' | 'cancelled' | 'rejected';

export const EXCLUSIVE_MATERIAL_STATUS_LABEL: Record<ExclusiveMaterialStatus, string> = {
  open: 'Nova solicitação', negotiating: 'Em negociação', awaiting_payment: 'Aguardando pagamento',
  paid: 'Pagamento confirmado', in_production: 'Em produção', delivered: 'Entregue',
  cancelled: 'Cancelada', rejected: 'Recusada'
};

export function exclusiveFinancials(amount: number) {
  const grossAmount = Number(amount.toFixed(2));
  const platformFeeAmount = Number((grossAmount * 0.13).toFixed(2));
  return { grossAmount, platformFeeAmount, creatorNetAmount: Number((grossAmount - platformFeeAmount).toFixed(2)) };
}
