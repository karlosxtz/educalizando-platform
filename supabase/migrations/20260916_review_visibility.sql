-- Avaliações públicas da Educalizando
-- Mantém os registros existentes publicados e permite ocultar avaliações sem
-- apagar o histórico do comprador.

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'aprovado'
  CHECK (status IN ('aprovado', 'oculto'));

UPDATE public.reviews
SET status = 'aprovado'
WHERE status IS NULL;

CREATE INDEX IF NOT EXISTS idx_reviews_product_public
  ON public.reviews (product_id, status, created_at DESC);
