-- Categorias globais para materiais de educação cristã.
-- Idempotente para permitir reaplicação em ambientes já atualizados.
with desired_categories(nome, slug) as (
  values
    ('Educação Cristã', 'educacao-crista'),
    ('Educação Cristã Clássica', 'educacao-crista-classica'),
    ('AEP (Abordagem Educacional por Princípios)', 'aep-abordagem-educacional-por-principios')
)
insert into public.categories (id, nome, slug, store_id, created_at)
select gen_random_uuid(), desired.nome, desired.slug, null, now()
from desired_categories desired
where not exists (
  select 1 from public.categories existing
  where existing.store_id is null and lower(existing.slug) = lower(desired.slug)
);
