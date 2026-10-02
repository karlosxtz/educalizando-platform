import assert from 'node:assert/strict';
import { summarizeAdditionalCreatorPayments } from '../src/lib/creator-revenue-summary';

const summary = summarizeAdditionalCreatorPayments([
  { status: 'paid', gross_amount: 100, platform_fee_amount: 13, creator_net_amount: 87 },
  { status: 'paid', gross_amount: '49.90', platform_fee_amount: '6.49', creator_net_amount: '43.41' },
  { status: 'pending', gross_amount: 20, platform_fee_amount: 2.6, creator_net_amount: 17.4 },
  { status: 'failed', gross_amount: 999, platform_fee_amount: 999, creator_net_amount: 999 },
]);

assert.equal(Number(summary.grossPaid.toFixed(2)), 149.9);
assert.equal(Number(summary.platformFees.toFixed(2)), 19.49);
assert.equal(Number(summary.availableNet.toFixed(2)), 130.41);
assert.equal(Number(summary.pendingNet.toFixed(2)), 17.4);

console.log('Receitas adicionais do criador incluem exclusivos e clubes sem contar pagamentos falhos.');
