export type CreatorPaymentSummaryRecord = {
  status?: string | null;
  gross_amount?: number | string | null;
  platform_fee_amount?: number | string | null;
  creator_net_amount?: number | string | null;
};

export function summarizeAdditionalCreatorPayments(payments: CreatorPaymentSummaryRecord[]) {
  return payments.reduce((summary, payment) => {
    const status = String(payment.status || '').toLowerCase();
    const gross = Math.max(0, Number(payment.gross_amount || 0));
    const platformFee = Math.max(0, Number(payment.platform_fee_amount || 0));
    const creatorNet = Math.max(0, Number(payment.creator_net_amount || 0));

    if (status === 'paid') {
      summary.grossPaid += gross;
      summary.platformFees += platformFee;
      summary.availableNet += creatorNet;
    } else if (status === 'pending') {
      summary.pendingNet += creatorNet;
    }
    return summary;
  }, { grossPaid: 0, platformFees: 0, availableNet: 0, pendingNet: 0 });
}
