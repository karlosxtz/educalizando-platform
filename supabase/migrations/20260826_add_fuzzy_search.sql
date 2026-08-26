-- Habilita as extensões necessárias (se ainda não estiverem ativas)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Remove a função antiga caso exista com outra assinatura
DROP FUNCTION IF EXISTS fuzzy_search_products(text, int);

-- Cria a função de busca difusa e tolerante a erros
CREATE OR REPLACE FUNCTION fuzzy_search_products(search_term text, max_results int DEFAULT 5)
RETURNS TABLE (id uuid, titulo text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.titulo
  FROM products p
  WHERE p.status = 'publicado'
    AND p.excluido_em IS NULL
    AND (
      -- Tenta correspondência direta via ILIKE sem acentos
      unaccent(p.titulo) ILIKE '%' || unaccent(search_term) || '%'
      -- Ou usa a similaridade de trigrama para capturar typos (ex: "poe" para "poesia" ou "oficna" para "oficina")
      OR unaccent(p.titulo) % unaccent(search_term)
      OR word_similarity(unaccent(search_term), unaccent(p.titulo)) > 0.3
    )
  ORDER BY 
    -- Ordena primeiro pela exatidão da correspondência (maior similaridade)
    similarity(unaccent(p.titulo), unaccent(search_term)) DESC,
    p.created_at DESC
  LIMIT max_results;
END;
$$;
