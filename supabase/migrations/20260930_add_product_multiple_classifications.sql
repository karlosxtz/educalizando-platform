-- Permite classificar cada produto em até cinco categorias e cinco níveis.
-- Os campos singulares continuam representando a opção principal para manter
-- compatibilidade com páginas, integrações e produtos já cadastrados.

alter table public.products
  add column if not exists category_ids uuid[] not null default '{}'::uuid[],
  add column if not exists education_level_ids uuid[] not null default '{}'::uuid[];

update public.products
set category_ids = array[category_id]
where category_id is not null
  and cardinality(category_ids) = 0;

update public.products
set education_level_ids = array[education_level_id]
where education_level_id is not null
  and cardinality(education_level_ids) = 0;

alter table public.products
  drop constraint if exists products_category_ids_max_five,
  add constraint products_category_ids_max_five
    check (cardinality(category_ids) <= 5),
  drop constraint if exists products_education_level_ids_max_five,
  add constraint products_education_level_ids_max_five
    check (cardinality(education_level_ids) <= 5);

create index if not exists idx_products_category_ids
  on public.products using gin (category_ids);

create index if not exists idx_products_education_level_ids
  on public.products using gin (education_level_ids);
