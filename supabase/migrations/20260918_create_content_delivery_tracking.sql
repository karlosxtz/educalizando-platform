-- Conteúdos digitais e eventos reais de entrega/acesso.
create table if not exists public.digital_contents (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  product_title text,
  titulo text not null,
  descricao text,
  tipo text not null check (tipo in ('ARQUIVO', 'LINK_EXTERNO')),
  url text not null,
  file_name text,
  file_size_bytes bigint,
  file_size_formatted text,
  mime_type text,
  downloads_count integer not null default 0,
  external_access_count integer not null default 0,
  download_limit integer,
  validity_days integer,
  active boolean not null default true,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_access_events (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  customer_id uuid,
  customer_name text,
  customer_email text,
  content_id text,
  content_title text not null,
  product_id uuid,
  product_title text,
  event_type text not null check (event_type in ('FILE_DOWNLOAD', 'EXTERNAL_LINK_ACCESS')),
  created_at timestamptz not null default now()
);

create index if not exists content_access_events_store_created_idx on public.content_access_events(store_id, created_at desc);

alter table public.digital_contents enable row level security;
alter table public.content_access_events enable row level security;

drop policy if exists "Creators manage own digital contents" on public.digital_contents;
create policy "Creators manage own digital contents" on public.digital_contents for all to authenticated using (
  exists (select 1 from public.stores where stores.id = digital_contents.store_id and stores.creator_id = auth.uid())
) with check (
  exists (select 1 from public.stores where stores.id = digital_contents.store_id and stores.creator_id = auth.uid())
);

drop policy if exists "Creators read own content access events" on public.content_access_events;
create policy "Creators read own content access events" on public.content_access_events for select to authenticated using (
  exists (select 1 from public.stores where stores.id = content_access_events.store_id and stores.creator_id = auth.uid())
);
