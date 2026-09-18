CREATE TABLE IF NOT EXISTS public.whatsapp_store_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL UNIQUE REFERENCES public.stores(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('inactive','pending','active','expired')),
  amount_cents INTEGER NOT NULL DEFAULT 1990,
  paid_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  order_nsu TEXT UNIQUE,
  checkout_url TEXT,
  transaction_nsu TEXT,
  instance_name TEXT UNIQUE,
  whatsapp_connected BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.whatsapp_store_subscriptions ENABLE ROW LEVEL SECURITY;
NOTIFY pgrst, 'reload schema';
