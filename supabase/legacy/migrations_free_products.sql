-- Migration: Adicionar Módulo de Produtos Gratuitos (Brindes)
-- Adiciona a coluna is_free na tabela products para distinguir iscas digitais de produtos pagos.

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT FALSE;

-- Criar um index para facilitar as buscas globais de brindes no painel do aluno
CREATE INDEX IF NOT EXISTS idx_products_is_free ON public.products (is_free) WHERE is_free = TRUE;

-- Comentário da coluna para documentação
COMMENT ON COLUMN public.products.is_free IS 'Indica se o produto é um brinde gratuito (isca digital). Se true, ignora checkout e valor deve ser 0.';
