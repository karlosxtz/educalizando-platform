ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS guided_chat_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS guided_chat_welcome text;
