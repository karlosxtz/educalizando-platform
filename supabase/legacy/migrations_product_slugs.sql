-- Migration: Adicionar coluna de slugs amigáveis aos produtos

-- 1. Adicionar a nova coluna
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS slug text;

-- 2. Popular os produtos existentes com um slug único de fallback baseado no ID
-- Isso garante que produtos antigos que não passaram pela função generateSlug()
-- tenham um slug válido para SEO (ex: produto-a1b2c3d4)
UPDATE public.products
SET slug = 'produto-' || substr(md5(id::text), 1, 8)
WHERE slug IS NULL;

-- 3. Aplicar restrição UNIQUE para evitar colisões no banco de dados
ALTER TABLE public.products
ADD CONSTRAINT products_slug_key UNIQUE (slug);
