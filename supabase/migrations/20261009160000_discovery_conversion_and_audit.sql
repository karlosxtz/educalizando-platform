-- Descoberta, confiança de compra e rastreabilidade operacional.
BEGIN;
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS review_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sales_count INTEGER NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.refresh_product_review_metrics()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE target UUID := COALESCE(NEW.product_id, OLD.product_id);
BEGIN
  UPDATE public.products p SET
    average_rating = COALESCE((SELECT ROUND(AVG(r.nota)::numeric, 2) FROM public.reviews r WHERE r.product_id = target AND COALESCE(r.status, 'aprovado') = 'aprovado'), 0),
    review_count = (SELECT COUNT(*) FROM public.reviews r WHERE r.product_id = target AND COALESCE(r.status, 'aprovado') = 'aprovado')
  WHERE p.id = target;
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trg_refresh_product_review_metrics ON public.reviews;
CREATE TRIGGER trg_refresh_product_review_metrics AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.refresh_product_review_metrics();

UPDATE public.products p SET
  average_rating = COALESCE((SELECT ROUND(AVG(r.nota)::numeric, 2) FROM public.reviews r WHERE r.product_id = p.id AND COALESCE(r.status, 'aprovado') = 'aprovado'), 0),
  review_count = (SELECT COUNT(*) FROM public.reviews r WHERE r.product_id = p.id AND COALESCE(r.status, 'aprovado') = 'aprovado'),
  sales_count = (SELECT COUNT(*) FROM public.order_items oi JOIN public.orders o ON o.id = oi.order_id WHERE oi.product_id::text = p.id::text AND o.status = 'paid');

CREATE OR REPLACE FUNCTION public.refresh_product_sales_metrics()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.products p SET sales_count = (
    SELECT COUNT(*) FROM public.order_items oi JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.product_id::text = p.id::text AND o.status = 'paid'
  ) WHERE p.id::text IN (SELECT product_id::text FROM public.order_items WHERE order_id = NEW.id);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_refresh_product_sales_metrics ON public.orders;
CREATE TRIGGER trg_refresh_product_sales_metrics AFTER UPDATE OF status ON public.orders FOR EACH ROW EXECUTE FUNCTION public.refresh_product_sales_metrics();

-- Escrita exclusivamente pelo servidor, que verifica o pedido pago.
DROP POLICY IF EXISTS "Alunos podem inserir suas próprias avaliações" ON public.reviews;
DROP POLICY IF EXISTS "Alunos podem atualizar suas próprias avaliações" ON public.reviews;
REVOKE INSERT, UPDATE ON public.reviews FROM authenticated, anon;

ALTER TABLE public.product_favorites
  ADD COLUMN IF NOT EXISTS price_when_favorited NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS last_notified_price NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS price_alerts_enabled BOOLEAN NOT NULL DEFAULT FALSE;

CREATE OR REPLACE FUNCTION public.capture_favorite_price()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  SELECT preco INTO NEW.price_when_favorited FROM public.products WHERE id = NEW.product_id;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_capture_favorite_price ON public.product_favorites;
CREATE TRIGGER trg_capture_favorite_price BEFORE INSERT ON public.product_favorites FOR EACH ROW EXECUTE FUNCTION public.capture_favorite_price();
DROP POLICY IF EXISTS "Usuário altera alertas dos favoritos" ON public.product_favorites;
CREATE POLICY "Usuário altera alertas dos favoritos" ON public.product_favorites FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
GRANT UPDATE(price_alerts_enabled) ON public.product_favorites TO authenticated;
UPDATE public.product_favorites f SET price_when_favorited = p.preco FROM public.products p WHERE p.id = f.product_id AND f.price_when_favorited IS NULL;

CREATE TABLE IF NOT EXISTS public.favorite_price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  favorite_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  old_price NUMERIC(10,2) NOT NULL,
  new_price NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed','skipped')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  attempts INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(favorite_user_id, product_id, new_price)
);
ALTER TABLE public.favorite_price_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuário lê seus alertas de preço" ON public.favorite_price_alerts;
CREATE POLICY "Usuário lê seus alertas de preço" ON public.favorite_price_alerts FOR SELECT TO authenticated USING (auth.uid() = favorite_user_id);
CREATE OR REPLACE VIEW public.favorite_price_alert_candidates AS
SELECT f.user_id, f.product_id, f.price_when_favorited, p.preco AS current_price
FROM public.product_favorites f JOIN public.products p ON p.id = f.product_id
WHERE f.price_alerts_enabled AND p.status = 'publicado' AND p.excluido_em IS NULL
  AND p.preco < f.price_when_favorited
  AND p.preco IS DISTINCT FROM f.last_notified_price
  AND NOT EXISTS (SELECT 1 FROM public.favorite_price_alerts a WHERE a.favorite_user_id = f.user_id AND a.product_id = f.product_id AND a.new_price = p.preco AND (a.status <> 'failed' OR a.attempts >= 3));
REVOKE ALL ON public.favorite_price_alert_candidates FROM anon, authenticated;
GRANT SELECT ON public.favorite_price_alert_candidates TO service_role;
CREATE OR REPLACE FUNCTION public.claim_favorite_price_alert(p_user UUID, p_product UUID, p_old NUMERIC, p_new NUMERIC)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE claimed UUID;
BEGIN
  INSERT INTO public.favorite_price_alerts(favorite_user_id, product_id, old_price, new_price)
  VALUES(p_user, p_product, p_old, p_new)
  ON CONFLICT(favorite_user_id, product_id, new_price) DO UPDATE
  SET status = 'pending', attempts = favorite_price_alerts.attempts + 1
  WHERE favorite_price_alerts.status = 'failed' AND favorite_price_alerts.attempts < 3
  RETURNING id INTO claimed;
  RETURN claimed;
END $$;
REVOKE ALL ON FUNCTION public.claim_favorite_price_alert(UUID,UUID,NUMERIC,NUMERIC) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_favorite_price_alert(UUID,UUID,NUMERIC,NUMERIC) TO service_role;

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_user_id UUID,
  action TEXT NOT NULL,
  entity_table TEXT NOT NULL,
  entity_id TEXT,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.audit_administrative_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'products' AND
    (to_jsonb(OLD) - ARRAY['views_count','sales_count','average_rating','review_count','updated_at']) =
    (to_jsonb(NEW) - ARRAY['views_count','sales_count','average_rating','review_count','updated_at']) THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.admin_audit_logs(actor_user_id, action, entity_table, entity_id, old_data, new_data)
  VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, COALESCE(NEW.id::text, OLD.id::text), CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END, CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END);
  RETURN COALESCE(NEW, OLD);
END $$;

DO $$ DECLARE table_name TEXT; BEGIN
  FOREACH table_name IN ARRAY ARRAY['products','categories','stores'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_admin_audit ON public.%I', table_name);
    EXECUTE format('CREATE TRIGGER trg_admin_audit AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.audit_administrative_change()', table_name);
  END LOOP;
END $$;

GRANT SELECT ON public.favorite_price_alerts TO authenticated;
CREATE TABLE IF NOT EXISTS public.operational_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  service TEXT NOT NULL,
  event TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_operational_events_service_created ON public.operational_events(service, created_at DESC);
ALTER TABLE public.operational_events ENABLE ROW LEVEL SECURITY;
NOTIFY pgrst, 'reload schema';
COMMIT;
