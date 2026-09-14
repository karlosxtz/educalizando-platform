-- Integridade financeira e de acesso: impede duplicidade em reprocessamentos de webhook.
-- Mantém um único acesso ativo por pedido/produto, preservando o registro ativo mais antigo.
WITH duplicated_access AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY order_id, product_id
      ORDER BY COALESCE(granted_at, created_at), id
    ) AS row_number
  FROM public.student_product_access
  WHERE order_id IS NOT NULL
    AND status = 'ACTIVE'
)
DELETE FROM public.student_product_access AS access
USING duplicated_access AS duplicate
WHERE access.id = duplicate.id
  AND duplicate.row_number > 1;

CREATE UNIQUE INDEX IF NOT EXISTS uq_wallet_transactions_order_type
  ON public.wallet_transactions(order_id, type)
  WHERE order_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_active_student_product_access_order
  ON public.student_product_access(order_id, product_id)
  WHERE order_id IS NOT NULL
    AND status = 'ACTIVE';

CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_asaas_payment_id
  ON public.orders(asaas_payment_id)
  WHERE asaas_payment_id IS NOT NULL;
