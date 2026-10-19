BEGIN;

-- Existing editorial articles remain platform articles (store_id = NULL).
-- Existing RLS policies and grants are intentionally unchanged.
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id),
  ADD COLUMN IF NOT EXISTS topic text;

CREATE INDEX IF NOT EXISTS idx_blog_posts_store_updated
  ON public.blog_posts (store_id, updated_at DESC);

COMMENT ON COLUMN public.blog_posts.store_id IS
  'Author store. Set by authenticated server routes, never trusted from client payloads.';
COMMENT ON COLUMN public.blog_posts.topic IS
  'Editorial topic selected by the creator; NULL for legacy platform articles.';

NOTIFY pgrst, 'reload schema';
COMMIT;
