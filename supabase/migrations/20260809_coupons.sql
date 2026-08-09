-- =============================================================================
-- EDUCA LIZANDO — MIGRATION SQL: MÓDULO DE CUPONS DE DESCONTO
-- =============================================================================

-- 1. Tabela Principal de Cupons
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL,
  tipo_desconto TEXT NOT NULL CHECK (tipo_desconto IN ('percentual', 'valor_fixo')),
  valor_desconto NUMERIC NOT NULL CHECK (valor_desconto > 0),
  data_inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_expiracao TIMESTAMPTZ NULL,
  limite_de_usos INT NULL,
  usos_atuais INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT coupons_store_codigo_unique UNIQUE (store_id, codigo)
);

-- Index de busca rápida por loja e código do cupom
CREATE INDEX IF NOT EXISTS idx_coupons_store_codigo ON public.coupons(store_id, upper(codigo));

-- 2. Tabela de Escopo do Cupom (Produtos ou Kits específicos)
CREATE TABLE IF NOT EXISTS public.coupon_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  product_id UUID NULL REFERENCES public.products(id) ON DELETE CASCADE,
  kit_id UUID NULL REFERENCES public.kits(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_coupon_products_coupon_id ON public.coupon_products(coupon_id);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_products ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS para Tabela `coupons`
-- Criadores da loja têm acesso total (CRUD)
CREATE POLICY "Criadores podem gerenciar cupons das suas lojas"
  ON public.coupons
  FOR ALL
  USING (
    store_id IN (
      SELECT id FROM public.stores WHERE creator_id = auth.uid()
    )
  )
  WITH CHECK (
    store_id IN (
      SELECT id FROM public.stores WHERE creator_id = auth.uid()
    )
  );

-- Leitura pública para validação de cupons ativos no checkout/vitrine
CREATE POLICY "Leitura pública de cupons ativos"
  ON public.coupons
  FOR SELECT
  USING (status = 'ativo');

-- 5. Políticas RLS para Tabela `coupon_products`
CREATE POLICY "Criadores podem gerenciar produtos dos cupons das suas lojas"
  ON public.coupon_products
  FOR ALL
  USING (
    coupon_id IN (
      SELECT c.id FROM public.coupons c
      JOIN public.stores s ON c.store_id = s.id
      WHERE s.creator_id = auth.uid()
    )
  )
  WITH CHECK (
    coupon_id IN (
      SELECT c.id FROM public.coupons c
      JOIN public.stores s ON c.store_id = s.id
      WHERE s.creator_id = auth.uid()
    )
  );

CREATE POLICY "Leitura pública de escopo dos cupons"
  ON public.coupon_products
  FOR SELECT
  USING (true);
