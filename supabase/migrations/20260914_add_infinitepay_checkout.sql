-- Metadados do novo checkout. As colunas Asaas permanecem para preservar o histórico antigo.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(20) NOT NULL DEFAULT 'asaas',
  ADD COLUMN IF NOT EXISTS checkout_url TEXT,
  ADD COLUMN IF NOT EXISTS infinitepay_transaction_nsu TEXT,
  ADD COLUMN IF NOT EXISTS infinitepay_invoice_slug TEXT,
  ADD COLUMN IF NOT EXISTS receipt_url TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_infinitepay_transaction_nsu
  ON public.orders(infinitepay_transaction_nsu)
  WHERE infinitepay_transaction_nsu IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_payment_provider
  ON public.orders(payment_provider);
