-- Campanhas rastreáveis geradas pelo Copiloto de Marketing IA.
-- O clique usa um identificador anônimo; nenhum dado pessoal é armazenado.
CREATE TABLE IF NOT EXISTS public.ai_marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 160),
  variant TEXT NOT NULL CHECK (variant IN ('A', 'B')),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_marketing_campaign_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.ai_marketing_campaigns(id) ON DELETE CASCADE,
  visitor_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, visitor_id)
);

CREATE TABLE IF NOT EXISTS public.ai_marketing_preferences (
  store_id UUID PRIMARY KEY REFERENCES public.stores(id) ON DELETE CASCADE,
  brand_voice TEXT NOT NULL DEFAULT 'acolhedora, clara e profissional' CHECK (char_length(brand_voice) BETWEEN 3 AND 240),
  primary_audience TEXT NOT NULL DEFAULT 'educadores e famílias' CHECK (char_length(primary_audience) BETWEEN 3 AND 160),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS ai_marketing_campaign_id UUID REFERENCES public.ai_marketing_campaigns(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ai_marketing_campaign_store_created
  ON public.ai_marketing_campaigns(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_marketing_campaign_click_campaign
  ON public.ai_marketing_campaign_clicks(campaign_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_ai_marketing_campaign
  ON public.orders(ai_marketing_campaign_id)
  WHERE ai_marketing_campaign_id IS NOT NULL;

ALTER TABLE public.ai_marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_marketing_campaign_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_marketing_preferences ENABLE ROW LEVEL SECURITY;

-- Toda leitura e escrita passa pelas rotas autenticadas do servidor.
REVOKE ALL ON TABLE public.ai_marketing_campaigns FROM anon, authenticated;
REVOKE ALL ON TABLE public.ai_marketing_campaign_clicks FROM anon, authenticated;
REVOKE ALL ON TABLE public.ai_marketing_preferences FROM anon, authenticated;
