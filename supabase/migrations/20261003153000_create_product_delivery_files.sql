-- Multiple deliverable files per product. Quantity is intentionally unlimited;
-- the platform enforces a maximum of 15 MB on each individual upload.
create table if not exists public.product_delivery_files (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  delivery_type text not null check (delivery_type in ('original', 'plr')),
  file_url text not null,
  file_name text not null,
  file_size_bytes bigint null check (file_size_bytes is null or (file_size_bytes >= 0 and file_size_bytes <= 15728640)),
  mime_type text null,
  order_index integer not null default 0 check (order_index >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, delivery_type, order_index)
);

create index if not exists product_delivery_files_product_type_idx
  on public.product_delivery_files(product_id, delivery_type, order_index);

alter table public.product_delivery_files enable row level security;

drop policy if exists "Creators manage own delivery files" on public.product_delivery_files;
create policy "Creators manage own delivery files"
on public.product_delivery_files
for all
to authenticated
using (
  exists (
    select 1 from public.products p
    join public.stores s on s.id = p.store_id
    where p.id = product_delivery_files.product_id and s.creator_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.products p
    join public.stores s on s.id = p.store_id
    where p.id = product_delivery_files.product_id and s.creator_id = auth.uid()
  )
);

insert into public.product_delivery_files (product_id, delivery_type, file_url, file_name, order_index)
select product_id, 'original', arquivo_url, coalesce(nullif(arquivo_nome, ''), 'Arquivo principal'), 0
from public.product_deliveries
where arquivo_url is not null and arquivo_url <> ''
on conflict (product_id, delivery_type, order_index) do nothing;

insert into public.product_delivery_files (product_id, delivery_type, file_url, file_name, order_index)
select product_id, 'plr', plr_license_url, 'Arquivo da licença PLR', 0
from public.product_deliveries
where plr_license_url is not null and plr_license_url <> ''
on conflict (product_id, delivery_type, order_index) do nothing;
