ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS meta_pixel_id TEXT,
  ADD COLUMN IF NOT EXISTS google_analytics_id TEXT;

COMMENT ON COLUMN public.stores.meta_pixel_id IS 'Meta/Facebook Pixel ID da vitrine pública da loja.';
COMMENT ON COLUMN public.stores.google_analytics_id IS 'Google Analytics 4 Measurement ID (G-...) da vitrine pública da loja.';

NOTIFY pgrst, 'reload schema';
