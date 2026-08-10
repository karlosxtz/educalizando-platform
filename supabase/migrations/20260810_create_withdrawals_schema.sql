-- =============================================================================
-- EDUCALIZANDO — MIGRATION: FASE C — SAQUE PIX AUTOMÁTICO DO CRIADOR
-- =============================================================================
-- Tabelas: creator_pix_keys, withdrawals e asaas_transfer_webhook_events
-- Execução Idempotente (Pode ser executada em bancos novos ou existentes sem erro)
-- =============================================================================

-- 1. Criar Tabela creator_pix_keys (se ainda não existir)
CREATE TABLE IF NOT EXISTS public.creator_pix_keys (
  id VARCHAR(64) PRIMARY KEY,
  creator_id VARCHAR(64) NOT NULL,
  store_id VARCHAR(64) NOT NULL,
  pix_key_type VARCHAR(20) NOT NULL DEFAULT 'CPF',
  pix_key VARCHAR(20) NOT NULL, -- Apenas números ex: 12345678901
  pix_key_masked VARCHAR(30) NOT NULL, -- ex: ***.***.123-**
  holder_name TEXT,
  holder_cpf VARCHAR(20),
  validation_status VARCHAR(20) NOT NULL DEFAULT 'VALID', -- PENDING, VALID, INVALID, BLOCKED
  validated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Criar Tabela withdrawals (se ainda não existir)
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id VARCHAR(64) PRIMARY KEY,
  creator_id VARCHAR(64) NOT NULL,
  store_id VARCHAR(64) NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  pix_key_id VARCHAR(64) REFERENCES public.creator_pix_keys(id),
  pix_key_type VARCHAR(20) NOT NULL DEFAULT 'CPF',
  pix_key_masked VARCHAR(30) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED
  asaas_transfer_id VARCHAR(64),
  asaas_external_reference VARCHAR(64),
  failure_reason TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processing_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Criar Tabela asaas_transfer_webhook_events para controle de idempotência do webhook Asaas
CREATE TABLE IF NOT EXISTS public.asaas_transfer_webhook_events (
  id VARCHAR(64) PRIMARY KEY,
  event_id VARCHAR(128) NOT NULL UNIQUE,
  transfer_id VARCHAR(64) NOT NULL,
  event_type VARCHAR(64) NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Criar Índices de Alta Performance
CREATE INDEX IF NOT EXISTS idx_pix_keys_store_id ON public.creator_pix_keys(store_id);
CREATE INDEX IF NOT EXISTS idx_pix_keys_creator_id ON public.creator_pix_keys(creator_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_store_id ON public.withdrawals(store_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_asaas_transfer_id ON public.withdrawals(asaas_transfer_id);

-- 5. Habilitar RLS (Row Level Security) e Políticas de Acesso
ALTER TABLE public.creator_pix_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asaas_transfer_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura de creator_pix_keys por store_id" ON public.creator_pix_keys;
CREATE POLICY "Permitir leitura de creator_pix_keys por store_id"
  ON public.creator_pix_keys FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Permitir insercao de creator_pix_keys via API" ON public.creator_pix_keys;
CREATE POLICY "Permitir insercao de creator_pix_keys via API"
  ON public.creator_pix_keys FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualizacao de creator_pix_keys via API" ON public.creator_pix_keys;
CREATE POLICY "Permitir atualizacao de creator_pix_keys via API"
  ON public.creator_pix_keys FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Permitir leitura de withdrawals por store_id" ON public.withdrawals;
CREATE POLICY "Permitir leitura de withdrawals por store_id"
  ON public.withdrawals FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Permitir insercao de withdrawals via API" ON public.withdrawals;
CREATE POLICY "Permitir insercao de withdrawals via API"
  ON public.withdrawals FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualizacao de withdrawals via API" ON public.withdrawals;
CREATE POLICY "Permitir atualizacao de withdrawals via API"
  ON public.withdrawals FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Permitir leitura de webhook events" ON public.asaas_transfer_webhook_events;
CREATE POLICY "Permitir leitura de webhook events"
  ON public.asaas_transfer_webhook_events FOR ALL
  USING (true);
