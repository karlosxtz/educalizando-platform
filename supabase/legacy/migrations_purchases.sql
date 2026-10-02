-- ==========================================================
-- MIGRATION SQL: MÓDULO DE ÁREA DE MEMBROS DO ALUNO (PURCHASES)
-- Executar no SQL Editor do projeto Supabase
-- ==========================================================

-- 1. Tabela de Matrículas e Compras (purchases)
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    kit_id UUID REFERENCES public.kits(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'liberado' CHECK (status IN ('liberado', 'pendente', 'pago', 'estornado')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_purchase_target CHECK (
        (product_id IS NOT NULL AND kit_id IS NULL) OR
        (product_id IS NULL AND kit_id IS NOT NULL)
    )
);

-- 2. Índices de Desempenho
CREATE INDEX IF NOT EXISTS idx_purchases_student_id ON public.purchases(student_id);
CREATE INDEX IF NOT EXISTS idx_purchases_product_id ON public.purchases(product_id);
CREATE INDEX IF NOT EXISTS idx_purchases_kit_id ON public.purchases(kit_id);
CREATE INDEX IF NOT EXISTS idx_purchases_store_id ON public.purchases(store_id);

-- 3. Ativar Row Level Security (RLS)
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS para a Tabela PURCHASES
DROP POLICY IF EXISTS "Aluno pode visualizar suas proprias compras" ON public.purchases;
CREATE POLICY "Aluno pode visualizar suas proprias compras" ON public.purchases
    FOR SELECT USING (
        student_id = auth.uid()
    );

DROP POLICY IF EXISTS "Criador pode consultar compras da sua loja" ON public.purchases;
CREATE POLICY "Criador pode consultar compras da sua loja" ON public.purchases
    FOR SELECT USING (
        store_id IN (
            SELECT id FROM public.stores WHERE creator_id = auth.uid()
        )
    );
