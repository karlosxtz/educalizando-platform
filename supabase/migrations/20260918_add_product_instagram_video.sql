ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS instagram_video_url TEXT;

COMMENT ON COLUMN public.products.instagram_video_url IS
  'URL pública de um post ou Reel do Instagram exibida como mídia complementar na galeria do produto.';

NOTIFY pgrst, 'reload schema';
