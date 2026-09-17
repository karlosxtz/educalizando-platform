-- Reparo para projetos que receberam o código de metadados pedagógicos
-- antes da migration original. Seguro para executar mais de uma vez.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS page_count INTEGER,
  ADD COLUMN IF NOT EXISTS age_range TEXT,
  ADD COLUMN IF NOT EXISTS format_details TEXT,
  ADD COLUMN IF NOT EXISTS preview_url TEXT;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_page_count_positive;

-- Dados legados sem quantidade válida não devem bloquear a normalização.
UPDATE public.products
SET page_count = NULL
WHERE page_count IS NOT NULL AND page_count <= 0;

ALTER TABLE public.products
  ADD CONSTRAINT products_page_count_positive
  CHECK (page_count IS NULL OR page_count > 0);

COMMENT ON COLUMN public.products.age_range IS 'Faixa etária recomendada pelo criador.';

-- Atualiza o schema cache do PostgREST para que a API reconheça imediatamente
-- as novas colunas sem exigir reinício manual do projeto.
NOTIFY pgrst, 'reload schema';
