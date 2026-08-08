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
    asaas_subaccount_id TEXT, -- Campo reservado para integração futura com split de pagamento Asaas
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
-- Permissão de leitura pública da loja pelo slug
CREATE POLICY "Lojas são públicas para leitura" ON public.stores
    FOR SELECT USING (true);

-- Permissão de criação apenas para usuários autenticados
CREATE POLICY "Criador pode criar sua própria loja" ON public.stores
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Permissão de atualização apenas pelo criador da loja
CREATE POLICY "Criador pode editar sua própria loja" ON public.stores
    FOR UPDATE USING (auth.uid() = creator_id);

-- Permissão de exclusão apenas pelo criador
CREATE POLICY "Criador pode deletar sua loja" ON public.stores
    FOR DELETE USING (auth.uid() = creator_id);

-- 7. Políticas de Segurança RLS para a Tabela PRODUCTS
-- Permissão de leitura pública dos produtos marcados como 'publicado'
CREATE POLICY "Produtos publicados são públicos para leitura" ON public.products
    FOR SELECT USING (status = 'publicado' OR store_id IN (
        SELECT id FROM public.stores WHERE creator_id = auth.uid()
    ));

-- Permissão de criação de produto se o usuário for o criador da loja
CREATE POLICY "Criador pode cadastrar produtos na sua loja" ON public.products
    FOR INSERT WITH CHECK (store_id IN (
        SELECT id FROM public.stores WHERE creator_id = auth.uid()
    ));

-- Permissão de atualização de produto pelo criador
CREATE POLICY "Criador pode editar produtos da sua loja" ON public.products
    FOR UPDATE USING (store_id IN (
        SELECT id FROM public.stores WHERE creator_id = auth.uid()
    ));

-- Permissão de exclusão de produto pelo criador
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
-- Buckets para upload de capas e arquivos didáticos entregues aos alunos

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-covers', 'product-covers', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-files', 'product-files', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Capas de produtos são públicas para leitura"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-covers');

CREATE POLICY "Criadores podem fazer upload de capas"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-covers' AND auth.role() = 'authenticated');

CREATE POLICY "Criadores podem ler seus arquivos didáticos"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-files' AND auth.role() = 'authenticated');

CREATE POLICY "Criadores podem fazer upload de arquivos didáticos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-files' AND auth.role() = 'authenticated');

CREATE POLICY "Criadores podem deletar seus arquivos e capas"
ON storage.objects FOR DELETE
USING ((bucket_id = 'product-covers' OR bucket_id = 'product-files') AND auth.role() = 'authenticated');

-- 10. TABELA DE CATEGORIAS / TEMAS (categories)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    slug TEXT NOT NULL,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE, -- NULL = Categoria Global, UUID = Categoria Customizada
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_store_id ON public.categories(store_id);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categorias globais e da loja são públicas para leitura" ON public.categories
    FOR SELECT USING (store_id IS NULL OR store_id IN (
        SELECT id FROM public.stores WHERE creator_id = auth.uid() OR true
    ));

CREATE POLICY "Criador pode criar sua categoria customizada" ON public.categories
    FOR INSERT WITH CHECK (store_id IS NOT NULL AND store_id IN (
        SELECT id FROM public.stores WHERE creator_id = auth.uid()
    ));

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
-- Armazena o Logo (avatar) e o Banner principal da vitrine da loja

INSERT INTO storage.buckets (id, name, public)
VALUES ('store-assets', 'store-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Leitura pública de logos e banners
CREATE POLICY "Assets de lojas são públicos para leitura"
ON storage.objects FOR SELECT
USING (bucket_id = 'store-assets');

-- Upload de logos e banners por criadores autenticados
CREATE POLICY "Criadores podem fazer upload de logos e banners"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'store-assets' AND auth.role() = 'authenticated');

-- Exclusão de assets pelo próprio criador
CREATE POLICY "Criadores podem deletar seus logos e banners"
ON storage.objects FOR DELETE
USING (bucket_id = 'store-assets' AND auth.role() = 'authenticated');
