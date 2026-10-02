-- Adiciona suporte para preco PLR na tabela de produtos
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS preco_plr NUMERIC DEFAULT 0;
