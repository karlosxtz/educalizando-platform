-- Métricas editoriais de campanhas do calendário.
-- Não armazena IP, e-mail, produto visualizado ou qualquer dado pessoal.
CREATE TABLE IF NOT EXISTS public.calendar_campaign_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag TEXT NOT NULL CHECK (char_length(tag) BETWEEN 1 AND 120),
  surface TEXT NOT NULL CHECK (surface IN ('homepage_campaign', 'homepage_monthly', 'homepage_upcoming', 'calendar')),
  visitor_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS calendar_campaign_clicks_tag_created_at_idx
  ON public.calendar_campaign_clicks (tag, created_at DESC);

CREATE INDEX IF NOT EXISTS calendar_campaign_clicks_created_at_idx
  ON public.calendar_campaign_clicks (created_at DESC);

ALTER TABLE public.calendar_campaign_clicks ENABLE ROW LEVEL SECURITY;

-- A gravação é feita exclusivamente pela rota de servidor com service role.
REVOKE ALL ON TABLE public.calendar_campaign_clicks FROM anon, authenticated;
