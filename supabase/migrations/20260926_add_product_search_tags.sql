-- Tags livres de busca são independentes de seasonal_tags, que guarda apenas
-- temas e datas do calendário pedagógico.
alter table public.products
  add column if not exists tags text[] not null default '{}';

create index if not exists products_tags_gin_idx
  on public.products using gin (tags);

comment on column public.products.tags is
  'Tags livres de busca do material. Não usar para datas ou temas do calendário escolar.';
