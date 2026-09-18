-- Oferta em Destaque: preço de referência e índice para a vitrine pública.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS preco_original numeric(10,2),
  ADD COLUMN IF NOT EXISTS is_featured_offer boolean NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'products_original_price_greater_than_sale'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_original_price_greater_than_sale
      CHECK (preco_original IS NULL OR preco_original > preco);
  END IF;
END $$;

-- Corrige registros já existentes que possuam preço de referência válido.
UPDATE public.products
SET is_featured_offer = (preco_original IS NOT NULL AND preco_original > preco)
WHERE is_featured_offer IS DISTINCT FROM (preco_original IS NOT NULL AND preco_original > preco);

CREATE INDEX IF NOT EXISTS products_featured_offer_public_idx
  ON public.products (created_at DESC)
  WHERE status = 'publicado' AND is_featured_offer = true;
