-- Public presentation metadata only. Existing tenant policies and delivery fields are unchanged.
BEGIN;
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS presentation_video_url text,
  ADD COLUMN IF NOT EXISTS video_as_cover boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN public.products.presentation_video_url IS 'Public YouTube or Instagram demonstration URL; never a delivery file.';
COMMENT ON COLUMN public.products.video_as_cover IS 'Opt-in video preview in public product cards; the image cover remains the fallback.';
NOTIFY pgrst, 'reload schema';
COMMIT;
