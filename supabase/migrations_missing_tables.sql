-- =============================================================================
-- EDUCALIZANDO — MIGRATION P1-4: TABELAS FALTANTES E RLS STRICT
-- =============================================================================
-- Criação formal das tabelas identificadas em código que não possuíam schema formal.

-- 1. wallet_transactions (Ledger financeiro)
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id VARCHAR(64) PRIMARY KEY,
  store_id VARCHAR(64) NOT NULL,
  creator_id VARCHAR(64),
  order_id VARCHAR(64),
  buyer_name TEXT,
  product_title TEXT,
  type VARCHAR(20) NOT NULL, -- SALE, WITHDRAWAL, REFUND, ADJUSTMENT
  status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
  gross_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  platform_fixed_fee_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  platform_percentage_fee_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  platform_fee_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  asaas_fee_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  net_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Criador le sua propria carteira" ON public.wallet_transactions
  FOR SELECT USING (store_id IN (SELECT id::text FROM public.stores WHERE creator_id = auth.uid()));
CREATE POLICY "Apenas servidor escreve no ledger" ON public.wallet_transactions
  FOR INSERT WITH CHECK (false);
CREATE POLICY "Servidor atualiza ledger" ON public.wallet_transactions
  FOR UPDATE USING (false);

-- 2. withdrawals (Saques)
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id VARCHAR(64) PRIMARY KEY,
  creator_id VARCHAR(64) NOT NULL,
  store_id VARCHAR(64) NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  pix_key_id VARCHAR(64) NOT NULL,
  pix_key_type VARCHAR(10) DEFAULT 'CPF',
  pix_key_masked VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  asaas_transfer_id VARCHAR(64),
  asaas_external_reference VARCHAR(64),
  failure_reason TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processing_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Criador le seus saques" ON public.withdrawals
  FOR SELECT USING (creator_id = auth.uid()::text);
CREATE POLICY "Apenas servidor processa saques" ON public.withdrawals
  FOR INSERT WITH CHECK (false);

-- 3. creator_pix_keys
CREATE TABLE IF NOT EXISTS public.creator_pix_keys (
  id VARCHAR(64) PRIMARY KEY,
  creator_id VARCHAR(64) NOT NULL,
  store_id VARCHAR(64) NOT NULL,
  pix_key_type VARCHAR(10) DEFAULT 'CPF',
  pix_key VARCHAR(100) NOT NULL,
  pix_key_masked VARCHAR(50) NOT NULL,
  holder_name TEXT,
  holder_cpf VARCHAR(20),
  validation_status VARCHAR(20) DEFAULT 'PENDING',
  validated_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.creator_pix_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Criador gerencia chaves PIX" ON public.creator_pix_keys
  FOR SELECT USING (creator_id = auth.uid()::text);
CREATE POLICY "Server-side insert" ON public.creator_pix_keys
  FOR INSERT WITH CHECK (false);
CREATE POLICY "Server-side update" ON public.creator_pix_keys
  FOR UPDATE USING (false);

-- 4. student_product_access
CREATE TABLE IF NOT EXISTS public.student_product_access (
  id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(64) NOT NULL,
  product_id VARCHAR(64) NOT NULL,
  store_id VARCHAR(64) NOT NULL,
  order_id VARCHAR(64),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  download_count INTEGER DEFAULT 0,
  max_downloads INTEGER,
  is_active BOOLEAN DEFAULT true
);

ALTER TABLE public.student_product_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aluno le acessos proprios" ON public.student_product_access
  FOR SELECT USING (student_id = auth.uid()::text OR student_id = auth.jwt() ->> 'email');
CREATE POLICY "Server-side acessos" ON public.student_product_access
  FOR ALL USING (false);

-- 5. digital_contents
CREATE TABLE IF NOT EXISTS public.digital_contents (
  id VARCHAR(64) PRIMARY KEY,
  product_id VARCHAR(64) NOT NULL,
  store_id VARCHAR(64) NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  content_type VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.digital_contents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso seguro a conteudos" ON public.digital_contents
  FOR SELECT USING (
    -- Criador ve os conteudos da sua loja
    store_id IN (SELECT id::text FROM public.stores WHERE creator_id = auth.uid())
    OR
    -- Aluno so ve se tiver acesso na tabela de acessos
    product_id IN (SELECT product_id FROM public.student_product_access WHERE student_id = auth.uid()::text OR student_id = auth.jwt() ->> 'email')
  );

-- 6. reviews, coupons, coupon_products, product_images
CREATE TABLE IF NOT EXISTS public.reviews (
  id VARCHAR(64) PRIMARY KEY,
  product_id VARCHAR(64) NOT NULL,
  store_id VARCHAR(64) NOT NULL,
  student_id VARCHAR(64),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews publicas" ON public.reviews FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.coupons (
  id VARCHAR(64) PRIMARY KEY,
  store_id VARCHAR(64) NOT NULL,
  code VARCHAR(50) NOT NULL,
  discount_type VARCHAR(20),
  discount_value NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ler cupons da loja" ON public.coupons FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.coupon_products (
  coupon_id VARCHAR(64) REFERENCES public.coupons(id) ON DELETE CASCADE,
  product_id VARCHAR(64) NOT NULL,
  PRIMARY KEY (coupon_id, product_id)
);
ALTER TABLE public.coupon_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ler regras de cupom" ON public.coupon_products FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.product_images (
  id VARCHAR(64) PRIMARY KEY,
  product_id VARCHAR(64) NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ler imagens de produto publicas" ON public.product_images FOR SELECT USING (true);
