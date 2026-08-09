-- ==========================================================
-- MIGRATION SQL: MÓDULO DE KITS (COMBOS DE PRODUTOS)
-- Executar no SQL Editor do projeto Supabase
-- ==========================================================

-- 1. Tabela Principal de Kits
CREATE TABLE IF NOT EXISTS public.kits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descricao TEXT,
    capa_url TEXT,
    preco_kit NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'publicado' CHECK (status IN ('rascunho', 'publicado')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Junção N:N (kit_items)
CREATE TABLE IF NOT EXISTS public.kit_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kit_id UUID NOT NULL REFERENCES public.kits(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_kit_product UNIQUE(kit_id, product_id)
);

-- 3. Índices para Busca Rápida e Performance
CREATE INDEX IF NOT EXISTS idx_kits_store_id ON public.kits(store_id);
CREATE INDEX IF NOT EXISTS idx_kits_status ON public.kits(status);
CREATE INDEX IF NOT EXISTS idx_kit_items_kit_id ON public.kit_items(kit_id);
CREATE INDEX IF NOT EXISTS idx_kit_items_product_id ON public.kit_items(product_id);

-- 4. Ativar Row Level Security (RLS)
ALTER TABLE public.kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kit_items ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS para a Tabela KITS

-- Leitura pública para kits publicados ou criados pelo próprio usuário logado
CREATE POLICY "Kits publicados sao publicos para leitura" ON public.kits
    FOR SELECT USING (
        status = 'publicado' OR store_id IN (
            SELECT id FROM public.stores WHERE creator_id = auth.uid()
        )
    );

-- Permissão de inserção se o usuário for o criador da loja
CREATE POLICY "Criador pode cadastrar kits na sua loja" ON public.kits
    FOR INSERT WITH CHECK (
        store_id IN (
            SELECT id FROM public.stores WHERE creator_id = auth.uid()
        )
    );

-- Permissão de atualização pelo criador da loja
CREATE POLICY "Criador pode editar kits da sua loja" ON public.kits
    FOR UPDATE USING (
        store_id IN (
            SELECT id FROM public.stores WHERE creator_id = auth.uid()
        )
    );

-- Permissão de exclusão pelo criador da loja
CREATE POLICY "Criador pode deletar kits da sua loja" ON public.kits
    FOR DELETE USING (
        store_id IN (
            SELECT id FROM public.stores WHERE creator_id = auth.uid()
        )
    );

-- 6. Políticas RLS para a Tabela KIT_ITEMS

-- Leitura pública para itens de kits cujos kits são visíveis
CREATE POLICY "Itens de kits sao publicos para leitura" ON public.kit_items
    FOR SELECT USING (
        kit_id IN (
            SELECT id FROM public.kits WHERE status = 'publicado' OR store_id IN (
                SELECT id FROM public.stores WHERE creator_id = auth.uid()
            )
        )
    );

-- Criador pode inserir itens no kit de sua loja
CREATE POLICY "Criador pode inserir itens no kit" ON public.kit_items
    FOR INSERT WITH CHECK (
        kit_id IN (
            SELECT k.id FROM public.kits k
            JOIN public.stores s ON k.store_id = s.id
            WHERE s.creator_id = auth.uid()
        )
    );

-- Criador pode deletar/modificar itens no kit de sua loja
CREATE POLICY "Criador pode deletar itens no kit" ON public.kit_items
    FOR DELETE USING (
        kit_id IN (
            SELECT k.id FROM public.kits k
            JOIN public.stores s ON k.store_id = s.id
            WHERE s.creator_id = auth.uid()
        )
    );
