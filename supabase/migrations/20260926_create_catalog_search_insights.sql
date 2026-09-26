-- Termos pesquisados no catálogo público, usados no painel de oportunidades dos criadores.
CREATE TABLE IF NOT EXISTS public.catalog_search_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  normalized_query TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT catalog_search_events_query_length CHECK (char_length(normalized_query) BETWEEN 2 AND 120)
);

CREATE INDEX IF NOT EXISTS idx_catalog_search_events_recent
  ON public.catalog_search_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_catalog_search_events_normalized_recent
  ON public.catalog_search_events (normalized_query, created_at DESC);

ALTER TABLE public.catalog_search_events ENABLE ROW LEVEL SECURITY;
-- A tabela é gravada e lida apenas pelas rotas do servidor com service_role.
