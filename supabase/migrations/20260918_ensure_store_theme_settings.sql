-- Garante que o salvamento de tema e estilo de botões esteja disponível
-- para lojas já criadas antes do recurso de personalização.
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS layout_theme TEXT NOT NULL DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS button_style TEXT NOT NULL DEFAULT 'rounded';

UPDATE public.stores
SET layout_theme = COALESCE(NULLIF(layout_theme, ''), 'default'),
    button_style = COALESCE(NULLIF(button_style, ''), 'rounded');
