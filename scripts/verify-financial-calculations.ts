import { strict as assert } from 'node:assert';
import { calculateOrderFinancials } from '../src/lib/order-service';
import { isValidCPF } from '../src/lib/infinitepay-service';

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
