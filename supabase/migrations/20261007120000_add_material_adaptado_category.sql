-- Categoria global disponível no cadastro e na edição de produtos de todas as lojas.
INSERT INTO public.categories (id, nome, slug, store_id, created_at)
SELECT gen_random_uuid(), 'Material adaptado', 'material-adaptado', NULL, now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories
  WHERE store_id IS NULL
    AND (slug = 'material-adaptado' OR lower(nome) = 'material adaptado')
);
