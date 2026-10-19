BEGIN;
-- Completes installations that ran the image helper before seen_ids was added.
-- No existing products, permissions, policies or import counters are changed.
ALTER TABLE public.platform_product_imports
  ADD COLUMN IF NOT EXISTS seen_ids text[] NOT NULL DEFAULT '{}';
NOTIFY pgrst, 'reload schema';
COMMIT;
