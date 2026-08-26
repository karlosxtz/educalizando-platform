-- Ativação da extensão unaccent caso não esteja ativa
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Criamos uma função Wrapper Imutável para o unaccent.
-- O PostgreSQL exige que funções usadas em colunas geradas ou índices (Generated Columns) sejam IMMUTABLE.
-- A função unaccent original é STABLE.
CREATE OR REPLACE FUNCTION immutable_unaccent(text)
  RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT AS
$func$
  SELECT unaccent('unaccent', $1);
$func$;

-- Criação da coluna gerada automaticamente
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS titulo_limpo text 
GENERATED ALWAYS AS (lower(immutable_unaccent(titulo))) STORED;

-- Criação de um índice otimizado (trigram) para o ILIKE
-- Habilita o pg_trgm (necessário para o gin_trgm_ops)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_products_titulo_limpo_trgm 
ON products USING GIN (titulo_limpo gin_trgm_ops);
