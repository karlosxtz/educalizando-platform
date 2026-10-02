-- MIGRATIONS SQL PARA A PLATAFORMA EDUCALIZANDO
-- Executar no SQL Editor do seu projeto Supabase

-- 1. Habilitar extensão UUID se necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Lojas de Criadores (stores)
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome_loja TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    descricao TEXT,
    logo_url TEXT,
    banner_url TEXT,
    cor_primaria TEXT DEFAULT '#ff5722',
    asaas_subaccount_id TEXT,
    whatsapp TEXT,
    instagram TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Produtos Didáticos (products)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descricao TEXT,
    tipo TEXT NOT NULL DEFAULT 'pdf' CHECK (tipo IN ('pdf', 'ebook', 'video', 'curso', 'simulado')),
    preco NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    capa_url TEXT,
    arquivo_url TEXT,
    status TEXT NOT NULL DEFAULT 'publicado' CHECK (status IN ('rascunho', 'publicado')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Criar Índices para busca rápida por slug e por criador
CREATE INDEX IF NOT EXISTS idx_stores_slug ON public.stores(slug);
CREATE INDEX IF NOT EXISTS idx_stores_creator_id ON public.stores(creator_id);
CREATE INDEX IF NOT EXISTS idx_products_store_id ON public.products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);

-- 5. Ativar RLS (Row Level Security)
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 6. Políticas de Segurança RLS para a Tabela STORES
DROP POLICY IF EXISTS "Lojas são públicas para leitura" ON public.stores;
CREATE POLICY "Lojas são públicas para leitura" ON public.stores
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Criador pode criar sua própria loja" ON public.stores;
CREATE POLICY "Criador pode criar sua própria loja" ON public.stores
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Criador pode editar sua própria loja" ON public.stores;
CREATE POLICY "Criador pode editar sua própria loja" ON public.stores
    FOR UPDATE USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Criador pode deletar sua loja" ON public.stores;
CREATE POLICY "Criador pode deletar sua loja" ON public.stores
    FOR DELETE USING (auth.uid() = creator_id);

-- 7. Políticas de Segurança RLS para a Tabela PRODUCTS
DROP POLICY IF EXISTS "Produtos publicados são públicos para leitura" ON public.products;
CREATE POLICY "Produtos publicados são públicos para leitura" ON public.products
    FOR SELECT USING (status = 'publicado' OR store_id IN (
        SELECT id FROM public.stores WHERE creator_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Criador pode cadastrar produtos na sua loja" ON public.products;
CREATE POLICY "Criador pode cadastrar produtos na sua loja" ON public.products
    FOR INSERT WITH CHECK (store_id IN (
        SELECT id FROM public.stores WHERE creator_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Criador pode editar produtos da sua loja" ON public.products;
CREATE POLICY "Criador pode editar produtos da sua loja" ON public.products
    FOR UPDATE USING (store_id IN (
        SELECT id FROM public.stores WHERE creator_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Criador pode deletar produtos da sua loja" ON public.products;
CREATE POLICY "Criador pode deletar produtos da sua loja" ON public.products
    FOR DELETE USING (store_id IN (
        SELECT id FROM public.stores WHERE creator_id = auth.uid()
    ));

-- 8. Função utilitária para gerar slugs únicos automaticamente
CREATE OR REPLACE FUNCTION generate_unique_store_slug(store_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    new_slug TEXT;
    counter INT := 1;
BEGIN
    base_slug := lower(regexp_replace(unaccent(store_name), '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);
    IF base_slug = '' THEN
        base_slug := 'loja';
    END IF;
    
    new_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM public.stores WHERE slug = new_slug) LOOP
        counter := counter + 1;
        new_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN new_slug;
END;
$$ LANGUAGE plpgsql;

-- 9. SUPABASE STORAGE BUCKETS & RLS POLICIES
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-covers', 'product-covers', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-files', 'product-files', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Capas de produtos são públicas para leitura" ON storage.objects;
CREATE POLICY "Capas de produtos são públicas para leitura"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-covers');

DROP POLICY IF EXISTS "Criadores podem fazer upload de capas" ON storage.objects;
CREATE POLICY "Criadores podem fazer upload de capas"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-covers' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Criadores podem ler seus arquivos didáticos" ON storage.objects;
CREATE POLICY "Criadores podem ler seus arquivos didáticos"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-files' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Criadores podem fazer upload de arquivos didáticos" ON storage.objects;
CREATE POLICY "Criadores podem fazer upload de arquivos didáticos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-files' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Criadores podem deletar seus arquivos e capas" ON storage.objects;
CREATE POLICY "Criadores podem deletar seus arquivos e capas"
ON storage.objects FOR DELETE
USING ((bucket_id = 'product-covers' OR bucket_id = 'product-files') AND auth.role() = 'authenticated');

-- 10. TABELA DE CATEGORIAS / TEMAS (categories)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    slug TEXT NOT NULL,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_store_id ON public.categories(store_id);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Categorias globais e da loja são públicas para leitura" ON public.categories;
CREATE POLICY "Categorias globais e da loja são públicas para leitura" ON public.categories
    FOR SELECT USING (store_id IS NULL OR store_id IN (
        SELECT id FROM public.stores WHERE creator_id = auth.uid() OR true
    ));

DROP POLICY IF EXISTS "Criador pode criar sua categoria customizada" ON public.categories;
CREATE POLICY "Criador pode criar sua categoria customizada" ON public.categories
    FOR INSERT WITH CHECK (store_id IS NOT NULL AND store_id IN (
        SELECT id FROM public.stores WHERE creator_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Criador pode editar/deletar suas categorias" ON public.categories;
CREATE POLICY "Criador pode editar/deletar suas categorias" ON public.categories
    FOR ALL USING (store_id IS NOT NULL AND store_id IN (
        SELECT id FROM public.stores WHERE creator_id = auth.uid()
    ));

-- Seed de Categorias Globais Iniciais
INSERT INTO public.categories (nome, slug, store_id)
VALUES 
    ('Matemática', 'matematica', NULL),
    ('Português & Literatura', 'portugues-literatura', NULL),
    ('Redação 1000', 'redacao-1000', NULL),
    ('Ciências & Biologia', 'ciencias-biologia', NULL),
    ('História & Geografia', 'historia-geografia', NULL),
    ('Física & Química', 'fisica-quimica', NULL),
    ('Concursos Públicos', 'concursos-publicos', NULL),
    ('Idiomas & Inglês', 'idiomas-ingles', NULL),
    ('Vestibular & ENEM', 'vestibular-enem', NULL),
    ('Educação Infantil', 'educacao-infantil', NULL),
    ('Outros Conteúdos', 'outros-conteudos', NULL)
ON CONFLICT DO NOTHING;

-- 11. TABELA DE NÍVEIS DE ESCOLARIDADE (education_levels)
CREATE TABLE IF NOT EXISTS public.education_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    ordem INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.education_levels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Níveis de escolaridade são públicos para leitura" ON public.education_levels;
CREATE POLICY "Níveis de escolaridade são públicos para leitura" ON public.education_levels
    FOR SELECT USING (true);

-- Seed de Níveis de Escolaridade Globais
INSERT INTO public.education_levels (nome, slug, ordem)
VALUES 
    ('Educação Infantil', 'educacao-infantil', 1),
    ('Ensino Fundamental I', 'ensino-fundamental-1', 2),
    ('Ensino Fundamental II', 'ensino-fundamental-2', 3),
    ('Ensino Médio', 'ensino-medio', 4),
    ('Pré-Vestibular / ENEM', 'pre-vestibular-enem', 5),
    ('Ensino Superior & Pós', 'ensino-superior-pos', 6),
    ('Concursos Públicos', 'concursos-publicos', 7),
    ('Idiomas & Cursos Livres', 'idiomas-cursos-livres', 8)
ON CONFLICT DO NOTHING;

-- 12. ALTERAR TABELA PRODUCTS
ALTER TABLE public.products 
    ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS education_level_id UUID REFERENCES public.education_levels(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_education_level_id ON public.products(education_level_id);

-- 13. BUCKET SUPABASE STORAGE PARA ASSETS DA LOJA (store-assets)
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-assets', 'store-assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Assets de lojas são públicos para leitura" ON storage.objects;
CREATE POLICY "Assets de lojas são públicos para leitura"
ON storage.objects FOR SELECT
USING (bucket_id = 'store-assets');

DROP POLICY IF EXISTS "Criadores podem fazer upload de logos e banners" ON storage.objects;
CREATE POLICY "Criadores podem fazer upload de logos e banners"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'store-assets' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Criadores podem deletar seus logos e banners" ON storage.objects;
CREATE POLICY "Criadores podem deletar seus logos e banners"
ON storage.objects FOR DELETE
USING (bucket_id = 'store-assets' AND auth.role() = 'authenticated');

-- 14. ADICIONAR COLUNAS DE WHATSAPP E INSTAGRAM EM TABELAS EXISTENTES (SE JÁ CRIADAS ANTES)
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS instagram TEXT;

-- 15. TABELAS DE KITS (COMBOS DE PRODUTOS) E KIT_ITEMS
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

CREATE TABLE IF NOT EXISTS public.kit_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kit_id UUID NOT NULL REFERENCES public.kits(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_kit_product UNIQUE(kit_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_kits_store_id ON public.kits(store_id);
CREATE INDEX IF NOT EXISTS idx_kits_status ON public.kits(status);
CREATE INDEX IF NOT EXISTS idx_kit_items_kit_id ON public.kit_items(kit_id);
CREATE INDEX IF NOT EXISTS idx_kit_items_product_id ON public.kit_items(product_id);

ALTER TABLE public.kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kit_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Kits publicados sao publicos para leitura" ON public.kits;
CREATE POLICY "Kits publicados sao publicos para leitura" ON public.kits
    FOR SELECT USING (
        status = 'publicado' OR store_id IN (
            SELECT id FROM public.stores WHERE creator_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Criador pode cadastrar kits na sua loja" ON public.kits;
CREATE POLICY "Criador pode cadastrar kits na sua loja" ON public.kits
    FOR INSERT WITH CHECK (
        store_id IN (
            SELECT id FROM public.stores WHERE creator_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Criador pode editar kits da sua loja" ON public.kits;
CREATE POLICY "Criador pode editar kits da sua loja" ON public.kits
    FOR UPDATE USING (
        store_id IN (
            SELECT id FROM public.stores WHERE creator_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Criador pode deletar kits da sua loja" ON public.kits;
CREATE POLICY "Criador pode deletar kits da sua loja" ON public.kits
    FOR DELETE USING (
        store_id IN (
            SELECT id FROM public.stores WHERE creator_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Itens de kits sao publicos para leitura" ON public.kit_items;
CREATE POLICY "Itens de kits sao publicos para leitura" ON public.kit_items
    FOR SELECT USING (
        kit_id IN (
            SELECT id FROM public.kits WHERE status = 'publicado' OR store_id IN (
                SELECT id FROM public.stores WHERE creator_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Criador pode inserir itens no kit" ON public.kit_items;
CREATE POLICY "Criador pode inserir itens no kit" ON public.kit_items
    FOR INSERT WITH CHECK (
        kit_id IN (
            SELECT k.id FROM public.kits k
            JOIN public.stores s ON k.store_id = s.id
            WHERE s.creator_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Criador pode deletar itens no kit" ON public.kit_items;
CREATE POLICY "Criador pode deletar itens no kit" ON public.kit_items
    FOR DELETE USING (
        kit_id IN (
            SELECT k.id FROM public.kits k
            JOIN public.stores s ON k.store_id = s.id
            WHERE s.creator_id = auth.uid()
        )
    );

-- 16. TABELA DE COMPRAS E MATRÍCULAS DOS ALUNOS (purchases)
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

CREATE INDEX IF NOT EXISTS idx_purchases_student_id ON public.purchases(student_id);
CREATE INDEX IF NOT EXISTS idx_purchases_product_id ON public.purchases(product_id);
CREATE INDEX IF NOT EXISTS idx_purchases_kit_id ON public.purchases(kit_id);
CREATE INDEX IF NOT EXISTS idx_purchases_store_id ON public.purchases(store_id);

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

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
