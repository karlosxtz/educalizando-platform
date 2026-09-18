-- Lembretes globais de carrinho abandonado, enviados somente pelo WhatsApp central.
CREATE TABLE IF NOT EXISTS public.abandoned_cart_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  browser_token UUID NOT NULL,
  recovery_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  store_id TEXT NOT NULL,
  store_slug TEXT NOT NULL,
  customer_name TEXT,
  phone_e164 VARCHAR(20) NOT NULL,
  consented_at TIMESTAMPTZ NOT NULL,
  cart_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','purchased','opted_out','expired')),
  send_after TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  order_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(browser_token, store_id)
);

CREATE INDEX IF NOT EXISTS abandoned_cart_reminders_due_idx ON public.abandoned_cart_reminders(status, send_after);
CREATE INDEX IF NOT EXISTS abandoned_cart_reminders_order_idx ON public.abandoned_cart_reminders(order_id);
ALTER TABLE public.abandoned_cart_reminders ENABLE ROW LEVEL SECURITY;
-- A tabela é acessada exclusivamente pelas rotas de servidor com service role.
NOTIFY pgrst, 'reload schema';
