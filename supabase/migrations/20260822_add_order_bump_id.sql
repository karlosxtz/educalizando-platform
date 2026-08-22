-- Adiciona a coluna order_bump_id na tabela products referenciando outro produto
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS order_bump_id UUID REFERENCES public.products(id) ON DELETE SET NULL;
