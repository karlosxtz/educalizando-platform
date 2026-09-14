import { strict as assert } from 'node:assert';
import { calculateOrderFinancials } from '../src/lib/order-service';
import { isValidCPF } from '../src/lib/infinitepay-service';

const settings = { platform_fee_percentage: 5, platform_fixed_fee: 0.99 };

const singleItem = calculateOrderFinancials([
  { productId: 'product-1', storeId: 'store-1', unitPrice: 100, quantity: 1 }
], 0, settings, 0);

assert.deepEqual(
  [singleItem.subtotalAmount, singleItem.platformFixedFeeAmount, singleItem.platformPercentageFeeAmount, singleItem.creatorNetAmount],
  [100, 0.99, 5, 94.01]
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
  [20, 1.98, 1, 15.02]
);

console.log('Cálculos financeiros verificados com sucesso.');
