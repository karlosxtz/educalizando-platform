-- Programa de indicação de criadores da Educalizando.
-- Regra comercial: 3% de cada venda paga por 12 meses, em um único nível.
-- A bonificação sai exclusivamente dos 13% da plataforma: 10% plataforma e 3% indicador.
-- Esta migration cria somente a fundação e não gera comissões retroativas.

CREATE TABLE IF NOT EXISTS public.creator_referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT creator_referral_codes_code_format CHECK (code ~ '^[A-Z0-9]{8,20}$'),
  CONSTRAINT creator_referral_codes_creator_unique UNIQUE (creator_id),
  CONSTRAINT creator_referral_codes_store_unique UNIQUE (store_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_creator_referral_codes_case_insensitive
  ON public.creator_referral_codes (LOWER(code));

CREATE TABLE IF NOT EXISTS public.creator_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code_id UUID NOT NULL REFERENCES public.creator_referral_codes(id) ON DELETE RESTRICT,
  referrer_creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  referrer_store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
  referred_creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  referred_store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
  rate_percent NUMERIC(5, 2) NOT NULL DEFAULT 3.00,
  attributed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  eligible_until TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT creator_referrals_single_level CHECK (referrer_creator_id <> referred_creator_id),
  CONSTRAINT creator_referrals_rate_check CHECK (rate_percent > 0 AND rate_percent <= 13),
  CONSTRAINT creator_referrals_period_check CHECK (eligible_until > attributed_at),
  CONSTRAINT creator_referrals_status_check CHECK (status IN ('active', 'cancelled')),
  CONSTRAINT creator_referrals_referred_creator_unique UNIQUE (referred_creator_id),
  CONSTRAINT creator_referrals_referred_store_unique UNIQUE (referred_store_id)
);

CREATE INDEX IF NOT EXISTS idx_creator_referrals_referrer
  ON public.creator_referrals (referrer_creator_id, status, eligible_until);
CREATE INDEX IF NOT EXISTS idx_creator_referrals_referred_store
  ON public.creator_referrals (referred_store_id, status, eligible_until);

CREATE TABLE IF NOT EXISTS public.creator_referral_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID NOT NULL REFERENCES public.creator_referrals(id) ON DELETE RESTRICT,
  order_id VARCHAR(64) NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  beneficiary_creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  beneficiary_store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
  referred_store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
  rate_percent NUMERIC(5, 2) NOT NULL,
  sale_subtotal_amount NUMERIC(10, 2) NOT NULL,
  platform_fee_amount NUMERIC(10, 2) NOT NULL,
  commission_amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  available_at TIMESTAMPTZ NOT NULL,
  reversed_at TIMESTAMPTZ,
  reversal_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT creator_referral_commissions_order_unique UNIQUE (order_id),
  CONSTRAINT creator_referral_commissions_rate_check CHECK (rate_percent > 0 AND rate_percent <= 13),
  CONSTRAINT creator_referral_commissions_amounts_check CHECK (
    sale_subtotal_amount >= 0
    AND platform_fee_amount >= 0
    AND commission_amount > 0
    AND commission_amount <= platform_fee_amount
  ),
  CONSTRAINT creator_referral_commissions_status_check CHECK (status IN ('pending', 'available', 'reversed')),
  CONSTRAINT creator_referral_commissions_reversal_check CHECK (
    (status = 'reversed' AND reversed_at IS NOT NULL)
    OR (status <> 'reversed' AND reversed_at IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_creator_referral_commissions_beneficiary
  ON public.creator_referral_commissions (beneficiary_creator_id, status, available_at);
CREATE INDEX IF NOT EXISTS idx_creator_referral_commissions_referral
  ON public.creator_referral_commissions (referral_id, created_at DESC);

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS creator_referral_id UUID REFERENCES public.creator_referrals(id) ON DELETE SET NULL;
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS creator_referral_commission_amount NUMERIC(10, 2) NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'orders_creator_referral_commission_amount_check'
      AND conrelid = 'public.orders'::regclass
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_creator_referral_commission_amount_check
      CHECK (creator_referral_commission_amount >= 0) NOT VALID;
  END IF;
END;
$$;

ALTER TABLE public.creator_referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_referral_commissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "creator_referral_codes_select_owner" ON public.creator_referral_codes;
CREATE POLICY "creator_referral_codes_select_owner"
  ON public.creator_referral_codes FOR SELECT TO authenticated
  USING (creator_id = auth.uid());

DROP POLICY IF EXISTS "creator_referrals_select_participant" ON public.creator_referrals;
CREATE POLICY "creator_referrals_select_participant"
  ON public.creator_referrals FOR SELECT TO authenticated
  USING (referrer_creator_id = auth.uid() OR referred_creator_id = auth.uid());

DROP POLICY IF EXISTS "creator_referral_commissions_select_beneficiary" ON public.creator_referral_commissions;
CREATE POLICY "creator_referral_commissions_select_beneficiary"
  ON public.creator_referral_commissions FOR SELECT TO authenticated
  USING (beneficiary_creator_id = auth.uid());

-- Nenhuma política de INSERT/UPDATE/DELETE é criada. Todas as mutações serão
-- feitas pelas APIs protegidas com service_role nas próximas etapas.

COMMENT ON TABLE public.creator_referral_codes IS 'Códigos compartilháveis de indicação de criadores.';
COMMENT ON TABLE public.creator_referrals IS 'Vínculo imutável de um nível entre criador indicador e loja indicada.';
COMMENT ON TABLE public.creator_referral_commissions IS 'Auditoria das comissões de 3% financiadas pela taxa da plataforma.';
COMMENT ON COLUMN public.creator_referrals.eligible_until IS 'Limite exclusivo de 12 meses definido no momento da atribuição.';
COMMENT ON COLUMN public.creator_referral_commissions.platform_fee_amount IS 'Taxa da plataforma antes do bônus; a comissão nunca reduz o líquido da indicada.';
