-- Permite cadastrar um material que inclui as duas apresentações.
BEGIN;
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_color_mode_check;
ALTER TABLE public.products ADD CONSTRAINT products_color_mode_check
  CHECK (color_mode IS NULL OR color_mode IN ('colorido', 'preto_e_branco', 'colorido_e_preto_e_branco'));
COMMENT ON COLUMN public.products.color_mode IS
  'Apresentação do material: colorido, preto e branco ou ambas as versões.';
COMMIT;
