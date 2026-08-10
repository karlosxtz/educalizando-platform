-- =============================================================================
-- EDUCALIZANDO — MIGRATION: TABELA WALLET_TRANSACTIONS (LEDGER FINANCEIRO IMUTÁVEL)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id VARCHAR(64) PRIMARY KEY,
  store_id VARCHAR(64) NOT NULL,
  creator_id VARCHAR(64),
  order_id VARCHAR(64) REFERENCES public.orders(id) ON DELETE SET NULL,
  type VARCHAR(30) NOT NULL, -- 'SALE', 'REFUND', 'ADJUSTMENT', 'WITHDRAWAL'
  status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED', -- 'PENDING', 'COMPLETED', 'CANCELLED'
  gross_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  platform_fixed_fee_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  platform_percentage_fee_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  platform_fee_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  asaas_fee_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  net_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de alta performance
CREATE INDEX IF NOT EXISTS idx_wallet_tx_store_id ON public.wallet_transactions(store_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_order_id ON public.wallet_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_type ON public.wallet_transactions(type);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_status ON public.wallet_transactions(status);

-- RLS (Row Level Security)
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura de wallet_transactions por store_id" ON public.wallet_transactions;
CREATE POLICY "Permitir leitura de wallet_transactions por store_id"
  ON public.wallet_transactions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Permitir insercao em wallet_transactions via API" ON public.wallet_transactions;
CREATE POLICY "Permitir insercao em wallet_transactions via API"
  ON public.wallet_transactions FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualizacao em wallet_transactions via API" ON public.wallet_transactions;
CREATE POLICY "Permitir atualizacao em wallet_transactions via API"
  ON public.wallet_transactions FOR UPDATE
  USING (true);
