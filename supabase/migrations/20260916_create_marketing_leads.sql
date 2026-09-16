CREATE TABLE IF NOT EXISTS public.marketing_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL DEFAULT 'site',
  consented_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketing_leads_created_at
  ON public.marketing_leads (created_at DESC);

ALTER TABLE public.marketing_leads ENABLE ROW LEVEL SECURITY;
