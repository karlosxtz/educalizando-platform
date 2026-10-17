-- New private integration tables only. Existing tables/policies remain unchanged.
begin;
create table if not exists public.creator_instagram_connections (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null unique references public.stores(id) on delete cascade,
  instagram_user_id text not null check (instagram_user_id ~ '^[0-9]+$'),
  username text not null,
  account_type text not null,
  token_encrypted text not null,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.creator_instagram_oauth_states (
  store_id uuid primary key references public.stores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  state_hash text not null unique,
  expires_at timestamptz not null
);
create table if not exists public.creator_instagram_posts (
  id uuid primary key,
  store_id uuid not null references public.stores(id) on delete cascade,
  connection_id uuid references public.creator_instagram_connections(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  target text not null check (target in ('story','feed')),
  caption text not null check (length(caption) <= 2200),
  image_key text not null,
  image_url text not null,
  image_size integer not null check (image_size between 1 and 8000000),
  status text not null default 'awaiting_upload' check (status in ('awaiting_upload','creating','processing','publishing','published','failed','uncertain')),
  container_id text,
  media_id text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists creator_instagram_posts_store_created_idx on public.creator_instagram_posts(store_id,created_at desc);
-- Secrets and operations are server-only. No direct client policies are granted.
alter table public.creator_instagram_connections enable row level security;
alter table public.creator_instagram_oauth_states enable row level security;
alter table public.creator_instagram_posts enable row level security;
revoke all on public.creator_instagram_connections, public.creator_instagram_oauth_states, public.creator_instagram_posts from anon, authenticated;
grant all on public.creator_instagram_connections, public.creator_instagram_oauth_states, public.creator_instagram_posts to service_role;
commit;
