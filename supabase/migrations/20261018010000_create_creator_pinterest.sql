-- Pinterest only: no existing policy, purchase rule or creator data is changed.
begin;
create table if not exists public.creator_pinterest_connections (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null unique references public.stores(id) on delete cascade,
  username text not null,
  token_encrypted text not null,
  refresh_encrypted text not null,
  expires_at timestamptz not null,
  sandbox boolean not null default true,
  board_id text check (board_id ~ '^[0-9]{1,30}$'),
  board_name text,
  auto_publish boolean not null default false,
  campaign_links boolean not null default true,
  refresh_lock_until timestamptz,
  updated_at timestamptz not null default now(),
  check (not auto_publish or board_id is not null)
);
create table if not exists public.creator_pinterest_oauth_states (
  store_id uuid primary key references public.stores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  state_hash text not null unique,
  expires_at timestamptz not null
);
create table if not exists public.creator_pinterest_jobs (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  connection_id uuid references public.creator_pinterest_connections(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  title text not null,
  source text not null check (source in ('automatic','manual')),
  board_id text not null check (board_id ~ '^[0-9]{1,30}$'),
  status text not null default 'queued' check (status in ('queued','processing','published','failed','uncertain','cancelled')),
  pin_id text,
  error_message text,
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(store_id,product_id)
);
create index if not exists creator_pinterest_jobs_queue_idx on public.creator_pinterest_jobs(next_attempt_at) where status = 'queued';
create index if not exists creator_pinterest_jobs_store_idx on public.creator_pinterest_jobs(store_id,created_at desc);
alter table public.creator_pinterest_connections enable row level security;
alter table public.creator_pinterest_oauth_states enable row level security;
alter table public.creator_pinterest_jobs enable row level security;
revoke all on public.creator_pinterest_connections, public.creator_pinterest_oauth_states, public.creator_pinterest_jobs from anon, authenticated;
grant all on public.creator_pinterest_connections, public.creator_pinterest_oauth_states, public.creator_pinterest_jobs to service_role;

-- Transactional outbox: no external requests, no backfill, only first publication.
create or replace function public.enqueue_creator_pinterest_product() returns trigger
language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  if new.status::text <> 'publicado' or new.excluido_em is not null then return new; end if;
  if tg_op = 'UPDATE' then
    if old.status::text = 'publicado' then return new; end if;
  end if;
  insert into public.creator_pinterest_jobs(store_id,connection_id,product_id,title,source,board_id)
    select new.store_id,c.id,new.id,new.titulo,'automatic',c.board_id
    from public.creator_pinterest_connections c
    where c.store_id = new.store_id and c.auto_publish and c.board_id is not null
    on conflict (store_id,product_id) do nothing;
  return new;
end;
$$;
revoke all on function public.enqueue_creator_pinterest_product() from public, anon, authenticated;
drop trigger if exists creator_pinterest_product_published on public.products;
create trigger creator_pinterest_product_published after insert or update of status on public.products
for each row execute function public.enqueue_creator_pinterest_product();

-- Claims serialized briefly; one in-flight job per connection. Never repeat an
-- expired claim automatically: the remote API may already have accepted its Pin.
create or replace function public.claim_creator_pinterest_job() returns setof public.creator_pinterest_jobs
language plpgsql security definer set search_path = pg_catalog, public as $$
declare candidate uuid;
begin
  perform pg_advisory_xact_lock(187432,61018);
  update public.creator_pinterest_jobs set status='uncertain', error_message='O envio foi interrompido. Confira o Pinterest antes de publicar novamente.', updated_at=now()
    where status='processing' and updated_at < now() - interval '5 minutes';
  select j.id into candidate from public.creator_pinterest_jobs j
    where j.status='queued' and j.next_attempt_at<=now()
    and not exists(select 1 from public.creator_pinterest_jobs running where running.connection_id=j.connection_id and running.status='processing')
    order by j.next_attempt_at,j.created_at limit 1 for update skip locked;
  if candidate is not null then
    return query update public.creator_pinterest_jobs set status='processing', attempts=attempts+1,updated_at=now()
      where id=candidate returning *;
  end if;
end;
$$;
revoke all on function public.claim_creator_pinterest_job() from public, anon, authenticated;
grant execute on function public.claim_creator_pinterest_job() to service_role;
commit;
