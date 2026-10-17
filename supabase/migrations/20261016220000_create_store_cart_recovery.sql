-- Execute TODO o arquivo. Recuperação privada de carrinhos originados na loja.
BEGIN;
CREATE TABLE IF NOT EXISTS public.store_cart_recovery (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
 browser_token uuid NOT NULL, recovery_token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
 parent_id uuid REFERENCES public.store_cart_recovery(id) ON DELETE SET NULL,
 items jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(items)='array' AND jsonb_array_length(items)<=20),
 total numeric(12,2) NOT NULL DEFAULT 0 CHECK(total>=0),
 stage text NOT NULL DEFAULT 'cart' CHECK(stage IN('cart','checkout','payment')),
 status text NOT NULL DEFAULT 'open' CHECK(status IN('open','cleared','converted')),
 customer_name text, phone text, consent_at timestamptz, consent_text text,
 order_id text, reminder_prepared_at timestamptz, reminder_sent_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(store_id,browser_token), CHECK(consent_at IS NOT NULL OR (phone IS NULL AND customer_name IS NULL))
);
CREATE INDEX IF NOT EXISTS store_cart_recovery_recent ON public.store_cart_recovery(store_id,updated_at DESC);
CREATE INDEX IF NOT EXISTS store_cart_recovery_order ON public.store_cart_recovery(order_id) WHERE order_id IS NOT NULL;
ALTER TABLE public.store_cart_recovery ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.store_cart_recovery FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.store_cart_recovery TO service_role;

CREATE OR REPLACE FUNCTION public.save_store_cart(p_store uuid,p_browser uuid,p_items jsonb,p_total numeric,p_stage text,p_contact jsonb DEFAULT NULL,p_parent uuid DEFAULT NULL)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_parent uuid; v_changed integer;
BEGIN
 IF p_stage NOT IN('cart','checkout') OR jsonb_typeof(p_items)<>'array' OR jsonb_array_length(p_items)>20 THEN RAISE EXCEPTION 'invalid cart'; END IF;
 SELECT id INTO v_parent FROM public.store_cart_recovery WHERE recovery_token=p_parent AND store_id=p_store AND browser_token<>p_browser AND status='open' AND created_at>now()-interval '7 days';
 INSERT INTO public.store_cart_recovery(store_id,browser_token,items,total,stage,status,customer_name,phone,consent_at,consent_text,parent_id)
 VALUES(p_store,p_browser,p_items,p_total,p_stage,CASE WHEN jsonb_array_length(p_items)=0 THEN 'cleared' ELSE 'open' END,
 CASE WHEN p_contact->>'consent'='true' THEN left(p_contact->>'name',120) END,
 CASE WHEN p_contact->>'consent'='true' THEN p_contact->>'phone' END,
 CASE WHEN p_contact->>'consent'='true' THEN now() END,
 CASE WHEN p_contact->>'consent'='true' THEN 'Autorizo esta loja a enviar um único lembrete deste carrinho pelo WhatsApp.' END,v_parent)
 ON CONFLICT(store_id,browser_token) DO UPDATE SET
 items=excluded.items,total=excluded.total,
 stage=CASE WHEN store_cart_recovery.items=excluded.items AND store_cart_recovery.stage='payment' THEN 'payment' ELSE excluded.stage END,
 status=excluded.status,
 order_id=CASE WHEN store_cart_recovery.items=excluded.items THEN store_cart_recovery.order_id ELSE NULL END,
 customer_name=CASE WHEN p_contact IS NULL THEN store_cart_recovery.customer_name ELSE excluded.customer_name END,
 phone=CASE WHEN p_contact IS NULL THEN store_cart_recovery.phone ELSE excluded.phone END,
 consent_at=CASE WHEN p_contact IS NULL THEN store_cart_recovery.consent_at ELSE excluded.consent_at END,
 consent_text=CASE WHEN p_contact IS NULL THEN store_cart_recovery.consent_text ELSE excluded.consent_text END,
 parent_id=store_cart_recovery.parent_id,updated_at=now()
 WHERE store_cart_recovery.status<>'converted' AND (store_cart_recovery.order_id IS NULL OR store_cart_recovery.items=excluded.items);
 GET DIAGNOSTICS v_changed=ROW_COUNT;
 RETURN CASE WHEN v_changed=0 THEN 'rotate' ELSE 'saved' END;
END $$;

CREATE OR REPLACE FUNCTION public.link_store_cart_order(p_store uuid,p_browser uuid,p_order text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.orders WHERE id::text=p_order AND store_id::text=p_store::text) THEN RETURN; END IF;
 UPDATE public.store_cart_recovery SET order_id=p_order,stage='payment',updated_at=now(),
 status=CASE WHEN EXISTS(SELECT 1 FROM public.orders WHERE id::text=p_order AND status='paid') THEN 'converted' ELSE status END
 WHERE store_id=p_store AND browser_token=p_browser AND status='open';
END $$;

CREATE OR REPLACE FUNCTION public.convert_store_cart_paid() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NEW.status='paid' THEN
  WITH RECURSIVE carts AS (
   SELECT id,parent_id,store_id,0 AS depth FROM public.store_cart_recovery WHERE order_id=NEW.id::text AND store_id::text=NEW.store_id::text
   UNION ALL SELECT p.id,p.parent_id,p.store_id,c.depth+1 FROM public.store_cart_recovery p JOIN carts c ON p.id=c.parent_id AND p.store_id=c.store_id WHERE c.depth<10
  ) UPDATE public.store_cart_recovery SET status='converted' WHERE id IN(SELECT id FROM carts);
 END IF; RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS store_cart_paid ON public.orders;
CREATE TRIGGER store_cart_paid AFTER UPDATE OF status ON public.orders FOR EACH ROW EXECUTE FUNCTION public.convert_store_cart_paid();

CREATE OR REPLACE FUNCTION public.report_store_carts(p_store uuid,p_days integer DEFAULT 30)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 WITH carts AS (
 SELECT c.id,c.recovery_token,c.items,c.total,c.stage,c.customer_name,c.phone,c.consent_at,c.reminder_prepared_at,c.reminder_sent_at,c.created_at,c.updated_at,
 CASE WHEN c.status='converted' OR o.status='paid' THEN 'converted' WHEN c.status='cleared' THEN 'cleared' WHEN c.created_at<now()-interval '7 days' THEN 'expired' WHEN c.updated_at<now()-interval '20 minutes' THEN 'abandoned' ELSE 'active' END AS state
 FROM public.store_cart_recovery c LEFT JOIN public.orders o ON o.id::text=c.order_id AND o.store_id::text=c.store_id::text
 WHERE c.store_id=p_store AND c.created_at>=now()-make_interval(days=>least(90,greatest(1,coalesce(p_days,30))))
 ), recent AS(SELECT * FROM carts ORDER BY updated_at DESC,id LIMIT 100)
 SELECT jsonb_build_object('total',(SELECT count(*) FROM carts),'abandoned',(SELECT count(*) FROM carts WHERE state='abandoned'),
 'converted',(SELECT count(*) FROM carts WHERE state='converted'),'active',(SELECT count(*) FROM carts WHERE state='active'),
 'recoverable_value',coalesce((SELECT sum(total) FROM carts WHERE state='abandoned'),0),
 'carts',coalesce((SELECT jsonb_agg(to_jsonb(r) ORDER BY r.updated_at DESC,r.id) FROM recent r),'[]'::jsonb));
$$;
REVOKE ALL ON FUNCTION public.save_store_cart(uuid,uuid,jsonb,numeric,text,jsonb,uuid),public.link_store_cart_order(uuid,uuid,text),public.convert_store_cart_paid(),public.report_store_carts(uuid,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.save_store_cart(uuid,uuid,jsonb,numeric,text,jsonb,uuid),public.link_store_cart_order(uuid,uuid,text),public.report_store_carts(uuid,integer) TO service_role;
COMMIT;
