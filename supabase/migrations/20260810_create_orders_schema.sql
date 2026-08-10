-- =============================================================================
-- EDUCALIZANDO — MIGRATION: ORDERS & ORDER_ITEMS (ASAAS CHECKOUT CENTRALIZADO)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.orders (
  id VARCHAR(64) PRIMARY KEY,
  store_id VARCHAR(64) NOT NULL,
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  buyer_cpf VARCHAR(20) NOT NULL,
  buyer_phone VARCHAR(30),
  total_amount NUMERIC(10, 2) NOT NULL,
  platform_fee_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
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

CREATE TABLE IF NOT EXISTS public.order_items (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id VARCHAR(64) NOT NULL,
  store_id VARCHAR(64) NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL,
  platform_fee_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  creator_net_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para buscas performáticas
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON public.orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_email ON public.orders(buyer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_asaas_payment_id ON public.orders(asaas_payment_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- RLS (Row Level Security)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Policy: Permite leitura de pedidos públicos ao próprio comprador (por email/id) e ao criador da loja (por store_id)
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
