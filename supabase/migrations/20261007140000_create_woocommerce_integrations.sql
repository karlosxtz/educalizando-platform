CREATE TABLE IF NOT EXISTS public.woocommerce_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL UNIQUE REFERENCES public.stores(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL,
  site_url TEXT NOT NULL,
  consumer_key_encrypted TEXT NOT NULL,
  consumer_secret_encrypted TEXT NOT NULL,
  webhook_secret_encrypted TEXT NOT NULL,
  webhook_ids JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error')),
  sync_products_to_woo BOOLEAN NOT NULL DEFAULT TRUE,
  sync_products_from_woo BOOLEAN NOT NULL DEFAULT TRUE,
  sync_orders_from_woo BOOLEAN NOT NULL DEFAULT TRUE,
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.woocommerce_product_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES public.woocommerce_integrations(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  woo_product_id BIGINT NOT NULL,
  woo_stock_status TEXT,
  woo_stock_quantity INTEGER,
  last_source TEXT NOT NULL DEFAULT 'educalizando' CHECK (last_source IN ('educalizando', 'woocommerce')),
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (integration_id, product_id),
  UNIQUE (integration_id, woo_product_id)
);

CREATE TABLE IF NOT EXISTS public.woocommerce_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES public.woocommerce_integrations(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  woo_order_id BIGINT NOT NULL,
  status TEXT NOT NULL,
  currency TEXT,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  raw_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  date_created TIMESTAMPTZ,
  date_modified TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (integration_id, woo_order_id)
);

CREATE TABLE IF NOT EXISTS public.woocommerce_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES public.woocommerce_integrations(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('to_woo', 'from_woo', 'webhook')),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('product', 'order', 'connection')),
  status TEXT NOT NULL CHECK (status IN ('success', 'partial', 'error')),
  processed_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.woocommerce_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES public.woocommerce_integrations(id) ON DELETE CASCADE,
  delivery_id TEXT NOT NULL,
  topic TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (integration_id, delivery_id)
);

CREATE INDEX IF NOT EXISTS idx_woo_orders_store ON public.woocommerce_orders(store_id, date_created DESC);
CREATE INDEX IF NOT EXISTS idx_woo_sync_logs_store ON public.woocommerce_sync_logs(store_id, created_at DESC);

ALTER TABLE public.woocommerce_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.woocommerce_product_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.woocommerce_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.woocommerce_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.woocommerce_webhook_events ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
