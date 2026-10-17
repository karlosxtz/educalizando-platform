-- Execute TODO este arquivo para ativar a importação contínua do WooCommerce.
BEGIN;
CREATE TABLE IF NOT EXISTS public.woocommerce_import_jobs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
 integration_id uuid NOT NULL REFERENCES public.woocommerce_integrations(id) ON DELETE CASCADE,
 mode text NOT NULL CHECK(mode IN('all','selected')), status text NOT NULL DEFAULT 'queued' CHECK(status IN('queued','running','paused','completed','cancelled')),
 page integer NOT NULL DEFAULT 1 CHECK(page>0), last_seen_id bigint NOT NULL DEFAULT 0, queue jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(queue)='array' AND jsonb_array_length(queue)<=1000), cursor integer NOT NULL DEFAULT 0,
 source_done boolean NOT NULL DEFAULT false, product_id uuid, assets jsonb NOT NULL DEFAULT '[]', asset_cursor integer NOT NULL DEFAULT 0,
 processed bigint NOT NULL DEFAULT 0, failed bigint NOT NULL DEFAULT 0, skipped bigint NOT NULL DEFAULT 0, discovered bigint NOT NULL DEFAULT 0, warnings bigint NOT NULL DEFAULT 0,
 issues jsonb NOT NULL DEFAULT '[]', last_error text, step_attempts integer NOT NULL DEFAULT 0,
 lease_token uuid, lease_until timestamptz, next_attempt_at timestamptz NOT NULL DEFAULT now(),
 cutoff timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS woo_import_one_active ON public.woocommerce_import_jobs(integration_id) WHERE status IN('queued','running','paused');
CREATE INDEX IF NOT EXISTS woo_import_queue ON public.woocommerce_import_jobs(next_attempt_at,updated_at) WHERE status IN('queued','running');
ALTER TABLE public.woocommerce_import_jobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.woocommerce_import_jobs FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.woocommerce_import_jobs TO service_role;

CREATE OR REPLACE FUNCTION public.claim_woo_import(p_store uuid DEFAULT NULL,p_job uuid DEFAULT NULL)
RETURNS SETOF public.woocommerce_import_jobs LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 RETURN QUERY WITH candidate AS (
  SELECT j.id FROM public.woocommerce_import_jobs j JOIN public.woocommerce_integrations i ON i.id=j.integration_id AND i.store_id=j.store_id
  WHERE j.status IN('queued','running') AND i.status='active' AND i.sync_products_from_woo=true
  AND (p_store IS NULL OR j.store_id=p_store) AND (p_job IS NULL OR j.id=p_job)
  AND (j.lease_until IS NULL OR j.lease_until<now()) AND j.next_attempt_at<=now()
  ORDER BY j.updated_at,j.id FOR UPDATE OF j SKIP LOCKED LIMIT 1
 ) UPDATE public.woocommerce_import_jobs j SET status='running',lease_token=gen_random_uuid(),lease_until=now()+interval '4 minutes',step_attempts=step_attempts+1,updated_at=now()
 FROM candidate c WHERE j.id=c.id RETURNING j.*;
END $$;
REVOKE ALL ON FUNCTION public.claim_woo_import(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_woo_import(uuid,uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.apply_woo_import_asset(p_store uuid,p_product uuid,p_asset_id uuid,p_kind text,p_index integer,p_asset jsonb,p_job uuid,p_lease uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 PERFORM id FROM public.woocommerce_import_jobs WHERE id=p_job AND store_id=p_store AND product_id=p_product AND lease_token=p_lease AND lease_until>now() AND status IN('running','queued','paused') FOR SHARE;
 IF NOT FOUND THEN RETURN false; END IF;
 PERFORM id FROM public.products WHERE id=p_product AND store_id=p_store AND import_incomplete=true FOR UPDATE;
 IF NOT FOUND THEN RETURN false; END IF;
 IF p_kind='image' THEN
  INSERT INTO public.product_images(id,product_id,url,ordem) VALUES(p_asset_id,p_product,p_asset->>'url',p_index)
  ON CONFLICT(id) DO UPDATE SET url=excluded.url,ordem=excluded.ordem WHERE product_images.product_id=p_product;
  UPDATE public.products SET capa_url=p_asset->>'url' WHERE id=p_product AND (p_index=0 OR capa_url IS NULL);
 ELSIF p_kind='delivery' THEN
  INSERT INTO public.product_delivery_files(id,product_id,delivery_type,file_url,file_name,file_size_bytes,mime_type,order_index)
  VALUES(p_asset_id,p_product,'original',p_asset->>'url',p_asset->>'name',(p_asset->>'size')::bigint,p_asset->>'mimeType',p_index)
  ON CONFLICT(id) DO UPDATE SET file_url=excluded.file_url,file_name=excluded.file_name,file_size_bytes=excluded.file_size_bytes,mime_type=excluded.mime_type,order_index=excluded.order_index WHERE product_delivery_files.product_id=p_product;
  IF p_index=0 OR NOT EXISTS(SELECT 1 FROM public.product_deliveries WHERE product_id=p_product) THEN
   INSERT INTO public.product_deliveries(product_id,arquivo_url,arquivo_nome) VALUES(p_product,p_asset->>'url',p_asset->>'name')
   ON CONFLICT(product_id) DO UPDATE SET arquivo_url=excluded.arquivo_url,arquivo_nome=excluded.arquivo_nome;
  END IF;
  UPDATE public.products SET has_original_delivery=true WHERE id=p_product;
 ELSE RAISE EXCEPTION 'invalid asset kind'; END IF;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.apply_woo_import_asset(uuid,uuid,uuid,text,integer,jsonb,uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.apply_woo_import_asset(uuid,uuid,uuid,text,integer,jsonb,uuid,uuid) TO service_role;
COMMIT;
