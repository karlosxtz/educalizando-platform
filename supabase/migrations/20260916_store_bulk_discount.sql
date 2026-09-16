-- Desconto automático por valor do carrinho, exclusivo para itens da mesma loja.
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS bulk_discount_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS bulk_discount_minimum NUMERIC(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bulk_discount_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0;

ALTER TABLE public.stores
  DROP CONSTRAINT IF EXISTS stores_bulk_discount_percentage_check;

ALTER TABLE public.stores
  ADD CONSTRAINT stores_bulk_discount_percentage_check
  CHECK (bulk_discount_percentage >= 0 AND bulk_discount_percentage <= 90);
