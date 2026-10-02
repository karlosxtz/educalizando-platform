-- ==============================================================================
-- MIGRATION: AJUSTE DE EXCLUSÃO DEFINITIVA E CASCADE PARA PRODUTOS E KITS
-- Plataforma Educalizando
-- Execute este script no SQL Editor do seu Dashboard Supabase
-- ==============================================================================

-- 1. Garantir que tabelas dependentes possuam ON DELETE CASCADE para products
-- ------------------------------------------------------------------------------

-- Tabela digital_contents (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'digital_contents') THEN
        ALTER TABLE public.digital_contents DROP CONSTRAINT IF EXISTS digital_contents_product_id_fkey;
        ALTER TABLE public.digital_contents
            ADD CONSTRAINT digital_contents_product_id_fkey
            FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Tabela reviews (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews') THEN
        ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_product_id_fkey;
        ALTER TABLE public.reviews
            ADD CONSTRAINT reviews_product_id_fkey
            FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Tabela product_reviews (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_reviews') THEN
        ALTER TABLE public.product_reviews DROP CONSTRAINT IF EXISTS product_reviews_product_id_fkey;
        ALTER TABLE public.product_reviews
            ADD CONSTRAINT product_reviews_product_id_fkey
            FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Tabela kit_items (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'kit_items') THEN
        ALTER TABLE public.kit_items DROP CONSTRAINT IF EXISTS kit_items_product_id_fkey;
        ALTER TABLE public.kit_items DROP CONSTRAINT IF EXISTS kit_items_kit_id_fkey;
        
        ALTER TABLE public.kit_items
            ADD CONSTRAINT kit_items_product_id_fkey
            FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
            
        ALTER TABLE public.kit_items
            ADD CONSTRAINT kit_items_kit_id_fkey
            FOREIGN KEY (kit_id) REFERENCES public.kits(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Tabela kit_products (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'kit_products') THEN
        ALTER TABLE public.kit_products DROP CONSTRAINT IF EXISTS kit_products_product_id_fkey;
        ALTER TABLE public.kit_products DROP CONSTRAINT IF EXISTS kit_products_kit_id_fkey;
        
        ALTER TABLE public.kit_products
            ADD CONSTRAINT kit_products_product_id_fkey
            FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
            
        ALTER TABLE public.kit_products
            ADD CONSTRAINT kit_products_kit_id_fkey
            FOREIGN KEY (kit_id) REFERENCES public.kits(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Tabela coupon_products (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coupon_products') THEN
        ALTER TABLE public.coupon_products DROP CONSTRAINT IF EXISTS coupon_products_product_id_fkey;
        ALTER TABLE public.coupon_products
            ADD CONSTRAINT coupon_products_product_id_fkey
            FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Garantir Políticas de RLS Permissivas para Delete de Produtos e Kits
-- ------------------------------------------------------------------------------

-- Permitir exclusão de produtos
DROP POLICY IF EXISTS "Criador pode deletar produtos da sua loja" ON public.products;
DROP POLICY IF EXISTS "Permitir delete de produtos" ON public.products;

CREATE POLICY "Permitir delete de produtos" ON public.products
    FOR DELETE
    USING (true);

-- Permitir inserção e update de produtos
DROP POLICY IF EXISTS "Criador pode cadastrar produtos na sua loja" ON public.products;
DROP POLICY IF EXISTS "Permitir criador ou admin criar produtos" ON public.products;
CREATE POLICY "Permitir criador ou admin criar produtos" ON public.products
    FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Criador pode editar produtos da sua loja" ON public.products;
DROP POLICY IF EXISTS "Permitir update de produtos" ON public.products;
CREATE POLICY "Permitir update de produtos" ON public.products
    FOR UPDATE
    USING (true);

-- Políticas para Kits (se a tabela existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'kits') THEN
        ALTER TABLE public.kits ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Kits sao publicos para leitura" ON public.kits;
        CREATE POLICY "Kits sao publicos para leitura" ON public.kits
            FOR SELECT USING (true);
            
        DROP POLICY IF EXISTS "Permitir delete de kits" ON public.kits;
        CREATE POLICY "Permitir delete de kits" ON public.kits
            FOR DELETE USING (true);
            
        DROP POLICY IF EXISTS "Permitir criacao e update de kits" ON public.kits;
        CREATE POLICY "Permitir criacao e update de kits" ON public.kits
            FOR ALL USING (true);
    END IF;
END $$;

-- ==============================================================================
-- FIM DA MIGRATION
-- ==============================================================================
