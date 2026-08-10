-- =============================================================================
-- EDUCALIZANDO — SCRIPT COMPLETO E IDEMPOTENTE: TABELAS ORDERS & ORDER_ITEMS
-- =============================================================================
-- Copie e cole todo este script diretamente no SQL Editor do seu projeto Supabase.
-- Ele cria as tabelas 'orders' e 'order_items' caso não existam e aplica os campos
-- financeiros definitivos (R$ 0,99/produto + 5% + Taxa Asaas real separada).
-- =============================================================================

-- 1. Criar Tabela orders (se ainda não existir)
CREATE TABLE IF NOT EXISTS public.orders (
  id VARCHAR(64) PRIMARY KEY,
  store_id VARCHAR(64) NOT NULL,
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  buyer_cpf VARCHAR(20) NOT NULL,
  buyer_phone VARCHAR(30),
  subtotal_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  platform_fixed_fee_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  platform_percentage_fee_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  platform_fee_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  asaas_fee_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  creator_net_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, paid, failed, refunded
  asaas_payment_id VARCHAR(64),
  asaas_customer_id VARCHAR(64),
  payment_method VARCHAR(20) NOT NULL DEFAULT 'pix', -- pix, credit_card, boleto
  pix_copy_paste TEXT,
  pix_qr_code_base64 TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

-- 2. Criar Tabela order_items (se ainda não existir)
CREATE TABLE IF NOT EXISTS public.order_items (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id VARCHAR(64) NOT NULL,
  store_id VARCHAR(64) NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  subtotal_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Adicionar Colunas Financeiras Detalhadas (Garantia para Instâncias Existentes)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal_amount NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS platform_fixed_fee_amount NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS platform_percentage_fee_amount NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS asaas_fee_amount NUMERIC(10, 2) DEFAULT 0;

ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS subtotal_amount NUMERIC(10, 2) DEFAULT 0;

-- 4. Criar Índices de Alta Performance
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON public.orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_email ON public.orders(buyer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_asaas_payment_id ON public.orders(asaas_payment_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- 5. Habilitar RLS (Row Level Security) e Políticas de Acesso
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura de orders por store_id ou buyer_email" ON public.orders;
CREATE POLICY "Permitir leitura de orders por store_id ou buyer_email"
  ON public.orders FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Permitir insercao publica de orders via API" ON public.orders;
CREATE POLICY "Permitir insercao publica de orders via API"
  ON public.orders FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualizacao de orders via API" ON public.orders;
CREATE POLICY "Permitir atualizacao de orders via API"
  ON public.orders FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Permitir operacoes em order_items" ON public.order_items;
CREATE POLICY "Permitir operacoes em order_items"
  ON public.order_items FOR ALL
  USING (true);

-- 6. Atualizar Registros Legados (se existirem)
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
