-- ==============================================================================
-- EDUCALIZANDO: MIGRATION DEFINITIVA DE SOFT DELETE (PRODUTOS & KITS)
-- ==============================================================================
-- Esta migration adiciona a coluna `excluido_em` e índices otimizados para garantir
-- que exclusões sejam registradas sem quebra de integridade financeira ou perda
-- de acesso de alunos que já compraram os materiais.
-- ==============================================================================

-- 1. Adicionar coluna excluido_em na tabela de produtos
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS excluido_em TIMESTAMPTZ DEFAULT NULL;

-- 2. Adicionar coluna excluido_em na tabela de kits/combos
ALTER TABLE public.kits 
ADD COLUMN IF NOT EXISTS excluido_em TIMESTAMPTZ DEFAULT NULL;

-- 3. Criar índices para acelerar consultas filtradas por excluido_em
CREATE INDEX IF NOT EXISTS idx_products_excluido_em ON public.products(excluido_em);
CREATE INDEX IF NOT EXISTS idx_kits_excluido_em ON public.kits(excluido_em);

-- 4. Garantir permissão de UPDATE para criadores no RLS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'products' AND policyname = 'Criadores podem atualizar seus produtos'
  ) THEN
    CREATE POLICY "Criadores podem atualizar seus produtos"
    ON public.products
    FOR UPDATE
    TO authenticated
    USING (
      store_id IN (
        SELECT id FROM public.stores WHERE creator_id = auth.uid()
      )
    )
    WITH CHECK (
      store_id IN (
        SELECT id FROM public.stores WHERE creator_id = auth.uid()
      )
    );
  END IF;
END $$;
