ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS import_source TEXT,
  ADD COLUMN IF NOT EXISTS import_incomplete BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS import_price_confirmed BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_import_source_check;
ALTER TABLE public.products ADD CONSTRAINT products_import_source_check
  CHECK (import_source IS NULL OR import_source IN ('woocommerce'));

COMMENT ON COLUMN public.products.import_source IS 'Origem externa do cadastro inicial do produto.';
COMMENT ON COLUMN public.products.import_incomplete IS 'Impede a publicação até que cadastro e entrega estejam completos.';
COMMENT ON COLUMN public.products.import_price_confirmed IS 'Confirma que o criador revisou o preço recebido de uma integração.';

UPDATE public.products AS product
SET import_source = 'woocommerce'
WHERE EXISTS (
  SELECT 1 FROM public.woocommerce_product_mappings AS mapping
  WHERE mapping.product_id = product.id
);

UPDATE public.products
SET import_price_confirmed = FALSE
WHERE import_source = 'woocommerce' AND status <> 'publicado';

UPDATE public.products AS product
SET import_incomplete = TRUE, status = 'rascunho'
WHERE product.import_source = 'woocommerce'
  AND product.status <> 'publicado'
  AND NOT EXISTS (
    SELECT 1 FROM public.product_deliveries AS delivery
    WHERE delivery.product_id = product.id
      AND NULLIF(BTRIM(delivery.arquivo_url), '') IS NOT NULL
  );

CREATE INDEX IF NOT EXISTS idx_products_import_incomplete
  ON public.products(store_id, import_incomplete)
  WHERE import_incomplete = TRUE;

NOTIFY pgrst, 'reload schema';
