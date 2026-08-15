-- ==============================================================================
-- EDUCALIZANDO: MIGRATION DEFINITIVA DE SOFT DELETE (PRODUTOS & KITS)
-- ==============================================================================
-- CAUSA RAIZ DO BUG: A coluna `status` possui um CHECK constraint que SÓ aceita
-- 'rascunho' e 'publicado'. Quando o código tenta SET status = 'excluido', o
-- PostgreSQL rejeita silenciosamente (retorna 0 linhas afetadas sem erro fatal
-- via API), fazendo a UI acreditar que funcionou mas nada muda no banco.
--
-- Esta migration corrige TODOS os problemas de uma vez:
-- 1. Adiciona coluna `excluido_em` (TIMESTAMPTZ, nullable)
-- 2. Corrige o CHECK constraint para aceitar 'excluido'
-- 3. Garante policies RLS de UPDATE para soft delete
-- 4. Cria índice parcial otimizado para queries de "não excluídos"
-- ==============================================================================

-- =============================================================
-- PASSO 1: ADICIONAR COLUNA excluido_em
-- =============================================================
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS excluido_em TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE public.kits 
ADD COLUMN IF NOT EXISTS excluido_em TIMESTAMPTZ DEFAULT NULL;

-- =============================================================
-- PASSO 2: CORRIGIR O CHECK CONSTRAINT DE status EM products
-- =============================================================
-- O constraint original só aceita ('rascunho', 'publicado').
-- Precisamos dropar e recriar para incluir 'excluido'.

DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    SELECT con.conname INTO constraint_name
    FROM pg_constraint con
    JOIN pg_class cls ON con.conrelid = cls.oid
    JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
    WHERE nsp.nspname = 'public'
      AND cls.relname = 'products'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%status%';
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.products DROP CONSTRAINT %I', constraint_name);
        RAISE NOTICE 'Dropped CHECK constraint: %', constraint_name;
    END IF;
END $$;

ALTER TABLE public.products 
ADD CONSTRAINT products_status_check 
CHECK (status IN ('rascunho', 'publicado', 'excluido'));

DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    SELECT con.conname INTO constraint_name
    FROM pg_constraint con
    JOIN pg_class cls ON con.conrelid = cls.oid
    JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
    WHERE nsp.nspname = 'public'
      AND cls.relname = 'kits'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%status%';
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.kits DROP CONSTRAINT %I', constraint_name);
        RAISE NOTICE 'Dropped CHECK constraint on kits: %', constraint_name;
    END IF;
END $$;

ALTER TABLE public.kits 
ADD CONSTRAINT kits_status_check 
CHECK (status IN ('rascunho', 'publicado', 'excluido'));

-- =============================================================
-- PASSO 3: ÍNDICES OTIMIZADOS
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_products_active 
ON public.products(store_id, created_at DESC) 
WHERE excluido_em IS NULL;

CREATE INDEX IF NOT EXISTS idx_kits_active 
ON public.kits(store_id, created_at DESC) 
WHERE excluido_em IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_excluido_em ON public.products(excluido_em);
CREATE INDEX IF NOT EXISTS idx_kits_excluido_em ON public.kits(excluido_em);

-- =============================================================
-- PASSO 4: GARANTIR POLICIES RLS DE UPDATE PARA SOFT DELETE
-- =============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'products' 
    AND policyname = 'Criadores podem atualizar seus produtos'
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

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'kits' 
    AND policyname = 'Criadores podem atualizar seus kits'
  ) THEN
    CREATE POLICY "Criadores podem atualizar seus kits"
    ON public.kits
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

-- =============================================================
-- FIM DA MIGRATION
-- =============================================================
-- INSTRUÇÕES: Execute este script inteiro no SQL Editor do Supabase.
-- Ele é idempotente (pode rodar múltiplas vezes sem efeito adverso).
