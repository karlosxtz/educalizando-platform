-- Filtros de datas e projetos escolares exibidos nas vitrines públicas.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS seasonal_tags text[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_products_seasonal_tags
  ON public.products USING GIN (seasonal_tags);
