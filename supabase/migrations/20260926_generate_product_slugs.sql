create extension if not exists unaccent;

with normalized as (
  select id,
    coalesce(nullif(trim(both '-' from regexp_replace(lower(unaccent(titulo)), '[^a-z0-9]+', '-', 'g')), ''), 'produto') as base_slug
  from public.products
), ranked as (
  select id, base_slug, row_number() over (partition by base_slug order by created_at, id) as position
  from normalized
)
update public.products product
set slug = case
  when ranked.position = 1 then ranked.base_slug
  else ranked.base_slug || '-' || ranked.position
end
from ranked
where product.id = ranked.id;

create unique index if not exists products_slug_unique_idx
  on public.products (slug)
  where slug is not null and slug <> '';
