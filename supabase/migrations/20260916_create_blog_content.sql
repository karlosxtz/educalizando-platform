CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 8 AND 180),
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  excerpt TEXT NOT NULL CHECK (char_length(excerpt) BETWEEN 40 AND 360),
  content TEXT NOT NULL,
  cover_url TEXT,
  seo_title TEXT CHECK (seo_title IS NULL OR char_length(seo_title) <= 180),
  seo_description TEXT CHECK (seo_description IS NULL OR char_length(seo_description) <= 320),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_publication
  ON public.blog_posts (status, published_at DESC);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Posts publicados são públicos" ON public.blog_posts;
CREATE POLICY "Posts publicados são públicos"
  ON public.blog_posts FOR SELECT
  USING (status = 'published' AND published_at IS NOT NULL AND published_at <= now());
