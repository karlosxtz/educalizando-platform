BEGIN;
-- Private provenance for imported deliveries. No existing policy is changed.
CREATE TABLE IF NOT EXISTS public.platform_import_delivery_receipts (
 store_id uuid NOT NULL REFERENCES public.stores(id),
 product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
 file_id uuid NOT NULL,
 delivery_index integer NOT NULL CHECK(delivery_index>=0 AND delivery_index<100),
 target_url text NOT NULL,
 PRIMARY KEY(product_id,delivery_index), UNIQUE(file_id)
);
ALTER TABLE public.platform_import_delivery_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.platform_import_delivery_receipts FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.platform_import_delivery_receipts TO service_role;

CREATE OR REPLACE FUNCTION public.apply_platform_import_delivery(
 p_job uuid,p_store uuid,p_lease uuid,p_product uuid,p_file_id uuid,p_index integer,p_asset jsonb,p_probe boolean DEFAULT false
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE j public.platform_product_imports%ROWTYPE; legacy_url text; destination text; expected_prefix text;
BEGIN
 IF p_probe THEN RETURN true; END IF;
 SELECT * INTO j FROM public.platform_product_imports
 WHERE id=p_job AND store_id=p_store AND lease_token=p_lease AND lease_until>now() AND status='running' AND current_product=p_product FOR UPDATE;
 IF NOT FOUND THEN RETURN false; END IF;
 IF p_index<0 OR p_index>=100 OR p_index>=jsonb_array_length(COALESCE(j.queue->j.cursor->'deliveries','[]'::jsonb)) THEN RETURN false; END IF;
 PERFORM id FROM public.products WHERE id=p_product AND store_id=p_store AND status='rascunho' AND import_incomplete=true FOR UPDATE;
 IF NOT FOUND THEN RETURN false; END IF;
 destination=p_asset->>'url';
 expected_prefix='minio://'||split_part(destination,'/',3)||'/platform-imports/'||p_store::text||'/'||p_product::text||'/deliveries/';
 IF destination IS NULL OR NOT (left(destination,length(expected_prefix))=expected_prefix OR destination ~ '^https://[^[:space:]@]+$')
 OR COALESCE(length(p_asset->>'name'),0)=0 OR length(p_asset->>'name')>160
 OR (p_asset->>'size')::bigint>15728640 THEN RAISE EXCEPTION 'invalid imported delivery'; END IF;
 -- Existing manual deliveries or edits are never replaced or mixed into the import.
 IF EXISTS(SELECT 1 FROM public.product_delivery_files f LEFT JOIN public.platform_import_delivery_receipts r
 ON r.file_id=f.id AND r.product_id=f.product_id AND r.store_id=p_store AND r.target_url=f.file_url
 WHERE f.product_id=p_product AND f.delivery_type='original' AND r.file_id IS NULL) THEN RETURN false; END IF;
 SELECT arquivo_url INTO legacy_url FROM public.product_deliveries WHERE product_id=p_product FOR UPDATE;
 IF NULLIF(legacy_url,'') IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.platform_import_delivery_receipts r
 WHERE r.product_id=p_product AND r.store_id=p_store AND r.delivery_index=0 AND r.target_url=legacy_url) THEN RETURN false; END IF;
 IF EXISTS(SELECT 1 FROM public.platform_import_delivery_receipts WHERE product_id=p_product AND delivery_index=p_index
 AND (file_id<>p_file_id OR target_url<>destination OR store_id<>p_store)) THEN RETURN false; END IF;
 INSERT INTO public.product_delivery_files(id,product_id,delivery_type,file_url,file_name,file_size_bytes,mime_type,order_index)
 VALUES(p_file_id,p_product,'original',destination,p_asset->>'name',(p_asset->>'size')::bigint,p_asset->>'mimeType',p_index)
 ON CONFLICT(product_id,delivery_type,order_index) DO NOTHING;
 IF NOT EXISTS(SELECT 1 FROM public.product_delivery_files WHERE id=p_file_id AND product_id=p_product AND file_url=destination AND delivery_type='original' AND order_index=p_index) THEN RAISE EXCEPTION 'delivery changed'; END IF;
 INSERT INTO public.platform_import_delivery_receipts(store_id,product_id,file_id,delivery_index,target_url)
 VALUES(p_store,p_product,p_file_id,p_index,destination) ON CONFLICT(product_id,delivery_index) DO NOTHING;
 IF p_index=0 THEN
  INSERT INTO public.product_deliveries(product_id,arquivo_url,arquivo_nome) VALUES(p_product,destination,p_asset->>'name')
  ON CONFLICT(product_id) DO UPDATE SET arquivo_url=excluded.arquivo_url,arquivo_nome=excluded.arquivo_nome,updated_at=now();
 END IF;
 UPDATE public.products SET has_original_delivery=true WHERE id=p_product;
 UPDATE public.platform_product_imports SET asset_cursor=GREATEST(asset_cursor,jsonb_array_length(j.queue->j.cursor->'images')+p_index+1) WHERE id=p_job;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.apply_platform_import_delivery(uuid,uuid,uuid,uuid,uuid,integer,jsonb,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.apply_platform_import_delivery(uuid,uuid,uuid,uuid,uuid,integer,jsonb,boolean) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
