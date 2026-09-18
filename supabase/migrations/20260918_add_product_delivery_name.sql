-- Nome amigável do material quando a entrega for por link externo.
ALTER TABLE public.product_deliveries
  ADD COLUMN IF NOT EXISTS arquivo_nome text;
