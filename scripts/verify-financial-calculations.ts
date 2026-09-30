import { strict as assert } from 'node:assert';
import { calculateOrderFinancials } from '../src/lib/order-service';
import { isValidCPF } from '../src/lib/infinitepay-service';
import { exclusiveFinancials } from '../src/lib/exclusive-material';
import { calculatePaymentProcessingFee, calculatePlatformFee, getPaymentProcessingFeePercentage, getPlatformFeePercentage, getTotalFeePercentage } from '../src/lib/payment-fees';

const settings = { platform_fee_percentage: 13, platform_fixed_fee: 0 };

const singleItem = calculateOrderFinancials([
  { productId: 'product-1', storeId: 'store-1', unitPrice: 100, quantity: 1 }
], 0, settings, 0);

assert.deepEqual(
  [singleItem.subtotalAmount, singleItem.platformFixedFeeAmount, singleItem.platformPercentageFeeAmount, singleItem.creatorNetAmount],
  [100, 0, 13, 87]
);

const oneReal = calculateOrderFinancials([
  { productId: 'product-1', storeId: 'store-1', unitPrice: 1, quantity: 1 }
], 0, settings, 0);

assert.deepEqual(
  [oneReal.platformPercentageFeeAmount, oneReal.creatorNetAmount],
  [0.13, 0.87],
  'R$1,00 deve reter R$0,13 e liberar R$0,87'
);

const cardAtSight = calculateOrderFinancials([
  { productId: 'product-1', storeId: 'store-1', unitPrice: 100, quantity: 1 }
], 0, settings, 0, 'credit_card');

assert.deepEqual(
  [cardAtSight.platformPercentageFeeAmount, cardAtSight.asaasFeeAmount, cardAtSight.creatorNetAmount],
  [13, 0, 87],
  'O criador arca somente com 13%; o processamento do cartão fica com o cliente'
);

assert.equal(getPlatformFeePercentage('pix'), 13);
assert.equal(getPlatformFeePercentage('credit_card'), 13);
assert.equal(getPaymentProcessingFeePercentage('credit_card', 1), 5.99);
assert.equal(getPaymentProcessingFeePercentage('credit_card', 12), 18.79);
assert.equal(getTotalFeePercentage('credit_card', 12), 31.79);
assert.equal(calculatePlatformFee(1, 'credit_card'), 0.13);
assert.equal(calculatePaymentProcessingFee(100, 'credit_card', 12), 18.79);
const tenReaisInFiveInstallments = calculateOrderFinancials([
  { productId: 'product-1', storeId: 'store-1', unitPrice: 10, quantity: 1 }
], 0, settings, 0, 'credit_card');
assert.deepEqual(
  [tenReaisInFiveInstallments.platformPercentageFeeAmount, tenReaisInFiveInstallments.asaasFeeAmount, tenReaisInFiveInstallments.creatorNetAmount],
  [1.3, 0, 8.7],
  'R$ 10,00 em 5x deve descontar somente R$ 1,30 do criador'
);
assert.deepEqual(exclusiveFinancials(100, 'pix'), { grossAmount: 100, platformFeePercentage: 13, platformFeeAmount: 13, paymentProcessingFeePercentage: 0, paymentProcessingFeeAmount: 0, totalFeePercentage: 13, creatorNetAmount: 87 });
assert.deepEqual(exclusiveFinancials(100, 'credit_card', 1), { grossAmount: 100, platformFeePercentage: 13, platformFeeAmount: 13, paymentProcessingFeePercentage: 5.99, paymentProcessingFeeAmount: 5.99, totalFeePercentage: 13, creatorNetAmount: 87 });
assert.deepEqual(exclusiveFinancials(100, 'credit_card', 12), { grossAmount: 100, platformFeePercentage: 13, platformFeeAmount: 13, paymentProcessingFeePercentage: 18.79, paymentProcessingFeeAmount: 18.79, totalFeePercentage: 13, creatorNetAmount: 87 });

assert.equal(isValidCPF('529.982.247-25'), true);
assert.equal(isValidCPF('111.111.111-11'), false);
assert.equal(isValidCPF('123'), false);

const multipleItemsWithAffiliate = calculateOrderFinancials([
  { productId: 'product-1', storeId: 'store-1', unitPrice: 10, quantity: 2 }
], 0, settings, 2);

assert.deepEqual(
  [
    multipleItemsWithAffiliate.subtotalAmount,
    multipleItemsWithAffiliate.platformFixedFeeAmount,
    multipleItemsWithAffiliate.platformPercentageFeeAmount,
    multipleItemsWithAffiliate.creatorNetAmount
  ],
  [20, 0, 2.6, 15.4]
);

console.log('Cálculos financeiros verificados com sucesso.');
