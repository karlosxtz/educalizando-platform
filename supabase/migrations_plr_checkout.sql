-- Adiciona suporte para identificar compras B2B (Licenca PLR) na tabela de pedidos
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_plr_purchase BOOLEAN DEFAULT false;
