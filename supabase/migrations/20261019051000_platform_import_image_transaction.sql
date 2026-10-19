BEGIN;
ALTER TABLE public.platform_product_imports ADD COLUMN IF NOT EXISTS seen_ids text[] NOT NULL DEFAULT '{}';
CREATE OR REPLACE FUNCTION public.apply_platform_import_image(p_job uuid,p_store uuid,p_lease uuid,p_product uuid,p_image_id uuid,p_url text,p_index integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 PERFORM id FROM public.platform_product_imports WHERE id=p_job AND store_id=p_store AND lease_token=p_lease AND lease_until>now() AND status IN('running','paused') FOR SHARE;
 IF NOT FOUND THEN RETURN false; END IF;
 PERFORM id FROM public.products WHERE id=p_product AND store_id=p_store AND status='rascunho' AND import_incomplete=true FOR UPDATE;
 IF NOT FOUND THEN RETURN false; END IF;
 IF p_index<0 OR p_url NOT LIKE 'https://arquivos.educalizando.com.br/public-images/%' THEN RAISE EXCEPTION 'invalid image'; END IF;
 INSERT INTO public.product_images(id,product_id,url,ordem) VALUES(p_image_id,p_product,p_url,p_index)
 ON CONFLICT(id) DO UPDATE SET url=excluded.url,ordem=excluded.ordem WHERE product_images.product_id=p_product;
 IF p_index=0 THEN UPDATE public.products SET capa_url=p_url WHERE id=p_product; END IF;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.apply_platform_import_image(uuid,uuid,uuid,uuid,uuid,text,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.apply_platform_import_image(uuid,uuid,uuid,uuid,uuid,text,integer) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
