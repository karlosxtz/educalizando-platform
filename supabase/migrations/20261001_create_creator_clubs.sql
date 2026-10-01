-- Clube do Criador: assinatura mensal independente do preço dos produtos.
create table if not exists public.creator_clubs (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null unique references public.stores(id) on delete cascade,
  creator_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 3 and 100),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text not null default '',
  cover_url text,
  monthly_price numeric(10,2) not null check (monthly_price >= 1),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.creator_club_materials (
  club_id uuid not null references public.creator_clubs(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  added_at timestamptz not null default now(),
  primary key (club_id, product_id)
);

create table if not exists public.creator_club_subscriptions (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.creator_clubs(id) on delete restrict,
  store_id uuid not null references public.stores(id) on delete restrict,
  student_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'pending' check (status in ('pending','active','expired','cancelled','refunded')),
  starts_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.creator_club_payments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.creator_club_subscriptions(id) on delete restrict,
  club_id uuid not null references public.creator_clubs(id) on delete restrict,
  store_id uuid not null references public.stores(id) on delete restrict,
  creator_id uuid not null references auth.users(id) on delete restrict,
  student_id uuid not null references auth.users(id) on delete restrict,
  order_nsu text not null unique,
  status text not null default 'pending' check (status in ('pending','paid','failed','refunded')),
  gross_amount numeric(10,2) not null check (gross_amount > 0),
  platform_fee_amount numeric(10,2) not null default 0,
  creator_net_amount numeric(10,2) not null default 0,
  checkout_url text,
  transaction_nsu text,
  invoice_slug text,
  payment_method text,
  installments integer not null default 1,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists creator_club_materials_product_idx on public.creator_club_materials(product_id);
create index if not exists creator_club_subscriptions_student_idx on public.creator_club_subscriptions(student_id, status, expires_at);
create index if not exists creator_club_subscriptions_club_idx on public.creator_club_subscriptions(club_id, status);
create index if not exists creator_club_payments_store_idx on public.creator_club_payments(store_id, status, paid_at);

alter table public.creator_clubs enable row level security;
alter table public.creator_club_materials enable row level security;
alter table public.creator_club_subscriptions enable row level security;
alter table public.creator_club_payments enable row level security;

drop policy if exists "Public can view published creator clubs" on public.creator_clubs;
create policy "Public can view published creator clubs" on public.creator_clubs for select
using (status = 'published' or creator_id = auth.uid());

drop policy if exists "Creators manage their creator club" on public.creator_clubs;
create policy "Creators manage their creator club" on public.creator_clubs for all
using (creator_id = auth.uid()) with check (creator_id = auth.uid());

drop policy if exists "Published club materials are visible" on public.creator_club_materials;
create policy "Published club materials are visible" on public.creator_club_materials for select
using (exists (select 1 from public.creator_clubs c where c.id = club_id and (c.status = 'published' or c.creator_id = auth.uid())));

drop policy if exists "Creators manage club materials" on public.creator_club_materials;
create policy "Creators manage club materials" on public.creator_club_materials for all
using (exists (select 1 from public.creator_clubs c where c.id = club_id and c.creator_id = auth.uid()))
with check (exists (select 1 from public.creator_clubs c where c.id = club_id and c.creator_id = auth.uid()));

drop policy if exists "Members view their club subscriptions" on public.creator_club_subscriptions;
create policy "Members view their club subscriptions" on public.creator_club_subscriptions for select
using (student_id = auth.uid() or exists (select 1 from public.creator_clubs c where c.id = club_id and c.creator_id = auth.uid()));

drop policy if exists "Members view their club payments" on public.creator_club_payments;
create policy "Members view their club payments" on public.creator_club_payments for select
using (student_id = auth.uid() or creator_id = auth.uid());

