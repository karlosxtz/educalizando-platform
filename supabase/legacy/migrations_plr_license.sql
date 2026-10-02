-- Adiciona o campo plr_license_url à tabela de produtos
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS plr_license_url TEXT;
