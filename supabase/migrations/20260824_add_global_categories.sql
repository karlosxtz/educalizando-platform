-- Adiciona novas categorias globais expandidas para cobrir todos os nichos educacionais

INSERT INTO public.categories (id, nome, slug, store_id, created_at)
VALUES
  (gen_random_uuid(), 'Berçário', 'bercario', NULL, now()),
  (gen_random_uuid(), 'Combo', 'combo', NULL, now()),
  (gen_random_uuid(), 'Educação Financeira', 'educacao-financeira', NULL, now()),
  (gen_random_uuid(), 'Ensino Religioso', 'ensino-religioso', NULL, now()),
  (gen_random_uuid(), 'Geografia', 'geografia', NULL, now()),
  (gen_random_uuid(), 'História', 'historia', NULL, now()),
  (gen_random_uuid(), 'Inglês', 'ingles', NULL, now()),
  (gen_random_uuid(), 'Jogos', 'jogos', NULL, now()),
  (gen_random_uuid(), 'Libras', 'libras', NULL, now()),
  (gen_random_uuid(), 'Música', 'musica', NULL, now()),
  (gen_random_uuid(), 'Planners e Organização', 'planners-e-organizacao', NULL, now()),
  (gen_random_uuid(), 'Outros', 'outros', NULL, now()),
  -- E as demais que foram pedidas no dropdown caso ainda não existam no seed
  (gen_random_uuid(), 'Alfabetização', 'alfabetizacao', NULL, now()),
  (gen_random_uuid(), 'Artes', 'artes', NULL, now()),
  (gen_random_uuid(), 'Datas Comemorativas', 'datas-comemorativas', NULL, now()),
  (gen_random_uuid(), 'Educação Especial', 'educacao-especial', NULL, now()),
  (gen_random_uuid(), 'Educação Infantil', 'educacao-infantil', NULL, now()),
  (gen_random_uuid(), 'Ensino Fundamental', 'ensino-fundamental', NULL, now()),
  (gen_random_uuid(), 'Ciência e Biologia', 'ciencia-e-biologia', NULL, now())
ON CONFLICT DO NOTHING;
