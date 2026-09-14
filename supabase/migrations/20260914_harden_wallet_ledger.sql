-- Protege o livro-caixa contra leitura e mutação direta pelo navegador.
-- A service role usada pelas APIs continua ignorando RLS normalmente.
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura de wallet_transactions por store_id" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Permitir insercao em wallet_transactions via API" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Permitir atualizacao em wallet_transactions via API" ON public.wallet_transactions;
DROP POLICY IF EXISTS "wallet_transactions_select_owner" ON public.wallet_transactions;

CREATE POLICY "wallet_transactions_select_owner"
  ON public.wallet_transactions
  FOR SELECT
  TO authenticated
  USING (
    creator_id = auth.uid()::text
    OR EXISTS (
      SELECT 1
      FROM public.stores
      WHERE stores.id::text = wallet_transactions.store_id::text
        AND stores.creator_id = auth.uid()
    )
  );

-- Diferencia os lançamentos do vendedor e do afiliado no mesmo pedido.
-- O valor vazio representa o saldo principal da loja (creator_id nulo).
DROP INDEX IF EXISTS public.uq_wallet_transactions_order_type;
CREATE UNIQUE INDEX IF NOT EXISTS uq_wallet_transactions_order_type_owner
  ON public.wallet_transactions(order_id, type, COALESCE(creator_id, ''))
  WHERE order_id IS NOT NULL;

-- Códigos promocionais não devem ser enumeráveis publicamente. Criadores continuam
-- gerenciando os cupons das próprias lojas; o checkout valida um código pelo servidor.
DROP POLICY IF EXISTS "Leitura pública de cupons ativos" ON public.coupons;
DROP POLICY IF EXISTS "Leitura pública de escopo dos cupons" ON public.coupon_products;

-- Segredos de integrações nunca ficam na tabela pública de lojas.
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS google_ai_key TEXT;
CREATE TABLE IF NOT EXISTS public.store_secrets (
  store_id UUID PRIMARY KEY REFERENCES public.stores(id) ON DELETE CASCADE,
  google_ai_key TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.store_secrets ENABLE ROW LEVEL SECURITY;

INSERT INTO public.store_secrets (store_id, google_ai_key)
SELECT id, google_ai_key
FROM public.stores
WHERE google_ai_key IS NOT NULL AND BTRIM(google_ai_key) <> ''
ON CONFLICT (store_id) DO UPDATE
SET google_ai_key = EXCLUDED.google_ai_key, updated_at = NOW();

UPDATE public.stores SET google_ai_key = NULL WHERE google_ai_key IS NOT NULL;

-- Arquivos pagos ficam separados dos metadados públicos dos produtos.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS has_original_delivery BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS has_plr_delivery BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS public.product_deliveries (
  product_id UUID PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
  arquivo_url TEXT,
  plr_license_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.product_deliveries ENABLE ROW LEVEL SECURITY;

INSERT INTO public.product_deliveries (product_id, arquivo_url, plr_license_url)
SELECT id, arquivo_url, plr_license_url
FROM public.products
WHERE arquivo_url IS NOT NULL OR plr_license_url IS NOT NULL
ON CONFLICT (product_id) DO UPDATE
SET arquivo_url = COALESCE(EXCLUDED.arquivo_url, product_deliveries.arquivo_url),
    plr_license_url = COALESCE(EXCLUDED.plr_license_url, product_deliveries.plr_license_url),
    updated_at = NOW();

UPDATE public.products
SET has_original_delivery = has_original_delivery OR (arquivo_url IS NOT NULL AND BTRIM(arquivo_url) <> ''),
    has_plr_delivery = has_plr_delivery OR (plr_license_url IS NOT NULL AND BTRIM(plr_license_url) <> ''),
    arquivo_url = NULL,
    plr_license_url = NULL
WHERE arquivo_url IS NOT NULL OR plr_license_url IS NOT NULL;

-- Bucket privado: criadores só manipulam os próprios objetos; alunos baixam por
-- URL temporária gerada pela API após a conferência da compra.
UPDATE storage.buckets SET public = FALSE WHERE id = 'product-files';

DROP POLICY IF EXISTS "Criadores podem ler seus arquivos didáticos" ON storage.objects;
DROP POLICY IF EXISTS "Criadores podem ler apenas seus proprios arquivos didaticos" ON storage.objects;
CREATE POLICY "Criadores podem ler apenas seus proprios arquivos didaticos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'product-files' AND owner = auth.uid());

DROP POLICY IF EXISTS "Criadores podem deletar seus arquivos e capas" ON storage.objects;
DROP POLICY IF EXISTS "Criadores podem excluir apenas seus proprios arquivos" ON storage.objects;
CREATE POLICY "Criadores podem excluir apenas seus proprios arquivos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id IN ('product-covers', 'product-files', 'store-assets')
    AND owner = auth.uid()
  );

-- Consumo de cupom ligado ao pedido, resistente a webhooks repetidos.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_consumed_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.consume_order_coupon(p_order_id VARCHAR)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coupon_id UUID;
BEGIN
  UPDATE public.orders
  SET coupon_consumed_at = NOW()
  WHERE id = p_order_id
    AND status = 'paid'
    AND coupon_id IS NOT NULL
    AND coupon_consumed_at IS NULL
  RETURNING coupon_id INTO v_coupon_id;

  IF v_coupon_id IS NULL THEN
    RETURN FALSE;
  END IF;

  UPDATE public.coupons
  SET usos_atuais = COALESCE(usos_atuais, 0) + 1
  WHERE id = v_coupon_id;
  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_order_coupon(VARCHAR) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_order_coupon(VARCHAR) TO service_role;

-- Notificações são criadas e removidas apenas pelo backend (service role ignora RLS).
DROP POLICY IF EXISTS "notifications_service_insert" ON public.notifications;
DROP POLICY IF EXISTS "notifications_service_delete" ON public.notifications;
DO $$
BEGIN
  IF to_regprocedure('public.cleanup_old_notifications()') IS NOT NULL THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.cleanup_old_notifications() FROM PUBLIC, anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.cleanup_old_notifications() TO service_role';
  END IF;
END;
$$;
