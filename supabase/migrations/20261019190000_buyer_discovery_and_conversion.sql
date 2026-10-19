-- Only new, private tables. Existing RLS, purchases and checkout are unchanged.
CREATE TABLE IF NOT EXISTS public.store_followers (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  notifications_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, store_id)
);
CREATE INDEX IF NOT EXISTS store_followers_store_idx ON public.store_followers(store_id);
ALTER TABLE public.store_followers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.store_followers FROM anon, authenticated;
GRANT ALL ON public.store_followers TO service_role;

CREATE TABLE IF NOT EXISTS public.store_conversion_events (
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  session_id uuid NOT NULL,
  stage text NOT NULL CHECK (stage IN ('view', 'cart', 'checkout')),
  event_day date NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (store_id, product_id, session_id, stage, event_day)
);
CREATE INDEX IF NOT EXISTS store_conversion_events_period_idx
  ON public.store_conversion_events(store_id, created_at, product_id);
ALTER TABLE public.store_conversion_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.store_conversion_events FROM anon, authenticated;
GRANT ALL ON public.store_conversion_events TO service_role;

CREATE OR REPLACE FUNCTION public.store_conversion_summary(p_store_id uuid, p_since timestamptz)
RETURNS TABLE(product_id uuid, views bigint, carts bigint, checkouts bigint)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT e.product_id,
    count(DISTINCT e.session_id) FILTER (WHERE stage = 'view'),
    count(DISTINCT e.session_id) FILTER (WHERE stage = 'cart'),
    count(DISTINCT e.session_id) FILTER (WHERE stage = 'checkout')
  FROM public.store_conversion_events e
  WHERE e.store_id = p_store_id AND e.created_at >= greatest(p_since, now() - interval '30 days')
  GROUP BY e.product_id;
$$;
REVOKE ALL ON FUNCTION public.store_conversion_summary(uuid, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.store_conversion_summary(uuid, timestamptz) TO service_role;

NOTIFY pgrst, 'reload schema';
