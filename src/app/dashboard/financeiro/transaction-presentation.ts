import { WalletTransaction } from '@/lib/wallet-service';

export function getTransactionPresentation(tx: WalletTransaction) {
  const refund = tx.type === 'REFUND' || tx.type === 'AFFILIATE_COMMISSION_REFUND';
  const withdrawal = tx.type === 'WITHDRAWAL';
  if (withdrawal) return { label: 'Saque PIX', className: 'bg-purple-50 text-purple-700 border-purple-200', valueClass: 'text-rose-600', direction: 'Débito' };
  if (refund) return { label: 'Estornado', className: 'bg-rose-50 text-rose-700 border-rose-200', valueClass: 'text-rose-600', direction: 'Débito' };
  if (tx.status === 'PENDING') return { label: 'Pendente', className: 'bg-amber-50 text-amber-700 border-amber-200', valueClass: 'text-amber-700', direction: 'Pendente' };
  return { label: 'Disponível', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', valueClass: 'text-emerald-700', direction: 'Crédito' };
}
