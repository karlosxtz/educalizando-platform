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
-- Permissão de leitura pública da loja pelo slug (para quem for comprar)
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
