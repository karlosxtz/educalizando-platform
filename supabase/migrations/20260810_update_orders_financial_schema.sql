-- =============================================================================
-- EDUCALIZANDO — MIGRATION: ATUALIZAÇÃO DO ESQUEMA FINANCEIRO DEFINITIVO (ASAAS)
-- =============================================================================
-- Regras Financeiras Definitivas:
-- 1. UMA COMPRA = UMA LOJA: Todos os itens de um pedido possuem store_id === order.store_id.
-- 2. COMISSÃO EDUCALIZANDO: R$ 0,99 por unidade de produto + 5% sobre o subtotal do pedido.
-- 3. TAXA ASAAS: Repassada ao criador (registrada separadamente em asaas_fee_amount).
-- 4. LÍQUIDO CRIADOR: creator_net_amount = subtotal - platform_fee - asaas_fee.
-- =============================================================================

-- Adicionar colunas financeiras detalhadas na tabela orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal_amount NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS platform_fixed_fee_amount NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS platform_percentage_fee_amount NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS asaas_fee_amount NUMERIC(10, 2) DEFAULT 0;

-- Adicionar colunas detalhadas na tabela order_items
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS subtotal_amount NUMERIC(10, 2) DEFAULT 0;

-- Atualizar registros legados (se existirem) para o novo esquema financeiro seguro
UPDATE public.orders
SET 
  subtotal_amount = COALESCE(total_amount, 0),
  platform_fixed_fee_amount = 0.99,
  platform_percentage_fee_amount = ROUND(COALESCE(total_amount, 0) * 0.05, 2),
  platform_fee_amount = 0.99 + ROUND(COALESCE(total_amount, 0) * 0.05, 2),
  asaas_fee_amount = COALESCE(asaas_fee_amount, 0),
  creator_net_amount = GREATEST(0, COALESCE(total_amount, 0) - (0.99 + ROUND(COALESCE(total_amount, 0) * 0.05, 2)) - COALESCE(asaas_fee_amount, 0))
WHERE subtotal_amount IS NULL OR subtotal_amount = 0;

UPDATE public.order_items
SET 
  quantity = COALESCE(quantity, 1),
  subtotal_amount = COALESCE(unit_price, 0) * COALESCE(quantity, 1)
WHERE subtotal_amount IS NULL OR subtotal_amount = 0;
