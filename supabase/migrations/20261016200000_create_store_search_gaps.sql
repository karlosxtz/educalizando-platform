-- Copie e execute TODO este arquivo no SQL Editor do Supabase.
-- Ativa o relatório privado de buscas sem resultado. Não altera produtos nem vendas.
BEGIN;

CREATE TABLE IF NOT EXISTS public.store_search_gaps (
  id uuid PRIMARY KEY,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  query text NOT NULL CHECK (char_length(query) BETWEEN 3 AND 120),
  normalized_query text NOT NULL CHECK (char_length(normalized_query) BETWEEN 3 AND 120),
  scope text NOT NULL CHECK (scope IN ('catalog', 'filters')),
  category_id uuid,
  education_level_id uuid,
  collection text NOT NULL CHECK (collection IN ('all', 'new', 'popular', 'plr')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS store_search_gaps_store_recent ON public.store_search_gaps(store_id, created_at DESC);
ALTER TABLE public.store_search_gaps ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.store_search_gaps FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_search_gaps TO service_role;

CREATE OR REPLACE FUNCTION public.report_store_search_gaps(p_store_id uuid, p_days integer DEFAULT 30, p_scope text DEFAULT 'all')
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  WITH searches AS (
    SELECT * FROM public.store_search_gaps
    WHERE store_id = p_store_id
      AND created_at >= now() - make_interval(days => least(90, greatest(1, coalesce(p_days,30))))
      AND (p_scope = 'all' OR scope = p_scope)
  ), grouped AS (
    SELECT normalized_query, min(query) AS term, count(*) AS count,
      count(*) FILTER (WHERE scope = 'catalog') AS catalog_count,
      count(*) FILTER (WHERE scope = 'filters') AS filtered_count,
      max(created_at) AS last_seen
    FROM searches GROUP BY normalized_query
  ), top_terms AS (
    SELECT term, count, catalog_count, filtered_count, last_seen
    FROM grouped ORDER BY count DESC, last_seen DESC, term ASC LIMIT 100
  )
  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM searches),
    'catalog_total', (SELECT count(*) FROM searches WHERE scope = 'catalog'),
    'filtered_total', (SELECT count(*) FROM searches WHERE scope = 'filters'),
    'distinct_terms', (SELECT count(*) FROM grouped),
    'terms', coalesce((SELECT jsonb_agg(to_jsonb(t) ORDER BY t.count DESC, t.last_seen DESC, t.term ASC) FROM top_terms t), '[]'::jsonb)
  );
$$;
REVOKE ALL ON FUNCTION public.report_store_search_gaps(uuid, integer, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.report_store_search_gaps(uuid, integer, text) TO service_role;

COMMIT;
