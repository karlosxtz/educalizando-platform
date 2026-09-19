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

-- Bancos que já possuíam a tabela antes deste módulo não recebem novas
-- colunas com CREATE TABLE IF NOT EXISTS. Estes ALTERs são aditivos e
-- preservam todos os conteúdos que o criador já cadastrou.
alter table public.digital_contents
  add column if not exists product_title text,
  add column if not exists descricao text,
  add column if not exists tipo text,
  add column if not exists url text,
  add column if not exists file_name text,
  add column if not exists file_size_bytes bigint,
  add column if not exists file_size_formatted text,
  add column if not exists mime_type text,
  add column if not exists downloads_count integer not null default 0,
  add column if not exists external_access_count integer not null default 0,
  add column if not exists download_limit integer,
  add column if not exists validity_days integer,
  add column if not exists active boolean not null default true,
  add column if not exists order_index integer not null default 0,
  add column if not exists updated_at timestamptz not null default now();

alter table public.content_access_events
  add column if not exists customer_name text,
  add column if not exists customer_email text,
  add column if not exists content_id text,
  add column if not exists content_title text,
  add column if not exists product_id uuid,
  add column if not exists product_title text,
  add column if not exists event_type text;

create index if not exists content_access_events_store_created_idx on public.content_access_events(store_id, created_at desc);

alter table public.digital_contents enable row level security;
alter table public.content_access_events enable row level security;

drop policy if exists "Creators manage own digital contents" on public.digital_contents;
create policy "Creators manage own digital contents" on public.digital_contents for all to authenticated using (
  exists (select 1 from public.stores where stores.id::text = digital_contents.store_id::text and stores.creator_id = auth.uid())
) with check (
  exists (select 1 from public.stores where stores.id::text = digital_contents.store_id::text and stores.creator_id = auth.uid())
);

drop policy if exists "Creators read own content access events" on public.content_access_events;
create policy "Creators read own content access events" on public.content_access_events for select to authenticated using (
  exists (select 1 from public.stores where stores.id::text = content_access_events.store_id::text and stores.creator_id = auth.uid())
);
