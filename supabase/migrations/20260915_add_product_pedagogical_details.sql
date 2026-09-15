-- Metadados pedagógicos e de apresentação usados no cadastro, vitrine, filtros e SEO.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS page_count INTEGER,
  ADD COLUMN IF NOT EXISTS age_range TEXT,
  ADD COLUMN IF NOT EXISTS format_details TEXT,
  ADD COLUMN IF NOT EXISTS preview_url TEXT;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_page_count_positive;

ALTER TABLE public.products
  ADD CONSTRAINT products_page_count_positive
  CHECK (page_count IS NULL OR page_count > 0);

COMMENT ON COLUMN public.products.page_count IS 'Quantidade de páginas ou telas do material, quando aplicável.';
COMMENT ON COLUMN public.products.age_range IS 'Faixa etária recomendada pelo criador.';
COMMENT ON COLUMN public.products.format_details IS 'Detalhes do formato: editável, colorido, para imprimir, entre outros.';
COMMENT ON COLUMN public.products.preview_url IS 'Link público opcional para prévia do material, sem acesso ao arquivo vendido.';
