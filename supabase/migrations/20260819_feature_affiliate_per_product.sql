-- =======================================================================================
-- EDUCALIZANDO - MIGRATION: MUDANÇA PARA AFILIAÇÃO POR PRODUTO
-- =======================================================================================

-- 1. Adicionar product_id
ALTER TABLE public.affiliates ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE CASCADE;

-- 2. Remover a restrição antiga que impedia múltiplos produtos
ALTER TABLE public.affiliates DROP CONSTRAINT IF EXISTS affiliates_store_id_user_id_key;

-- 3. Adicionar a nova restrição
-- Ao usar a restrição convencional UNIQUE, os NULLS são considerados distintos.
-- Portanto, o banco permitirá o registro legado (NULL) juntamente com registros novos contendo product_id.
ALTER TABLE public.affiliates ADD CONSTRAINT affiliates_store_id_user_id_product_id_key UNIQUE (store_id, user_id, product_id);
