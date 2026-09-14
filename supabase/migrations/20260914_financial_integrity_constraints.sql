-- Integridade financeira e de acesso: impede duplicidade em reprocessamentos de webhook.
CREATE UNIQUE INDEX IF NOT EXISTS uq_wallet_transactions_order_type
  ON public.wallet_transactions(order_id, type)
  WHERE order_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_active_student_product_access_order
  ON public.student_product_access(order_id, product_id)
  WHERE order_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_asaas_payment_id
  ON public.orders(asaas_payment_id)
  WHERE asaas_payment_id IS NOT NULL;
