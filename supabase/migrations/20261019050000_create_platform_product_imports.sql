BEGIN;
-- New, server-only import state. Existing policies, product rules and data stay unchanged.
CREATE TABLE IF NOT EXISTS public.platform_product_imports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 store_id uuid NOT NULL REFERENCES public.stores(id),
 provider text NOT NULL DEFAULT 'saberdidatico' CHECK(provider='saberdidatico'),
 token_fingerprint text NOT NULL,
 source_owner text NOT NULL,
 source_label text NOT NULL,
 status text NOT NULL DEFAULT 'paused' CHECK(status IN('paused','running','completed','cancelled')),
 queue jsonb NOT NULL DEFAULT '[]',
 cursor integer NOT NULL DEFAULT 0,
 next_url text,
 visited_urls text[] NOT NULL DEFAULT '{}',
 source_total integer,
 discovered integer NOT NULL DEFAULT 0,
 imported integer NOT NULL DEFAULT 0,
 skipped integer NOT NULL DEFAULT 0,
 current_product uuid,
 asset_cursor integer NOT NULL DEFAULT 0,
 issues jsonb NOT NULL DEFAULT '[]',
 last_error text,
 lease_token uuid,
 lease_until timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS platform_import_one_active
 ON public.platform_product_imports(store_id,provider) WHERE status IN('running','paused');
CREATE TABLE IF NOT EXISTS public.platform_product_import_receipts (
 store_id uuid NOT NULL REFERENCES public.stores(id),
 provider text NOT NULL CHECK(provider='saberdidatico'),
 source_owner text NOT NULL,
 source_id text NOT NULL,
 product_id uuid NOT NULL REFERENCES public.products(id),
 imported_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(store_id,provider,source_owner,source_id),
 UNIQUE(product_id)
);
ALTER TABLE public.platform_product_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_product_import_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.platform_product_imports,public.platform_product_import_receipts FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.platform_product_imports,public.platform_product_import_receipts TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
