CREATE TABLE IF NOT EXISTS public.product_favorites (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_product_favorites_product_id
  ON public.product_favorites (product_id);

ALTER TABLE public.product_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuário visualiza seus produtos favoritos" ON public.product_favorites;
CREATE POLICY "Usuário visualiza seus produtos favoritos"
  ON public.product_favorites
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuário adiciona seus produtos favoritos" ON public.product_favorites;
CREATE POLICY "Usuário adiciona seus produtos favoritos"
  ON public.product_favorites
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuário remove seus produtos favoritos" ON public.product_favorites;
CREATE POLICY "Usuário remove seus produtos favoritos"
  ON public.product_favorites
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, DELETE ON public.product_favorites TO authenticated;
