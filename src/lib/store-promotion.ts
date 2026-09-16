import type { Store } from './types';

export function getStorePromotion(store: Pick<Store, 'bulk_discount_enabled' | 'bulk_discount_minimum' | 'bulk_discount_percentage'> | undefined, subtotal: number) {
  const minimum = Number(store?.bulk_discount_minimum || 0);
  const percentage = Number(store?.bulk_discount_percentage || 0);
  const enabled = Boolean(store?.bulk_discount_enabled && minimum > 0 && percentage > 0);
  const qualified = enabled && subtotal >= minimum;
  const discountAmount = qualified ? Number((subtotal * percentage / 100).toFixed(2)) : 0;

  return {
    enabled,
    qualified,
    minimum,
    percentage,
    discountAmount,
    amountRemaining: enabled ? Math.max(0, Number((minimum - subtotal).toFixed(2))) : 0,
  };
}
