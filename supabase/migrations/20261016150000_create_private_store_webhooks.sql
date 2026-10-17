-- EDUCALIZANDO: Webhooks privados por loja.
-- Cole o arquivo INTEIRO no SQL Editor do projeto correto e execute uma vez.
-- Nao envia dados para destinos externos; o envio depende da aplicacao publicada.
-- Nao cria integracoes nem credenciais de lojistas automaticamente.
begin;

alter table public.orders add column if not exists tracking_parameters jsonb not null default '{}'::jsonb;

create table if not exists public.store_webhook_endpoints (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null check (length(name) between 1 and 100),
  provider text not null check (provider in ('generic','utmify')),
  url text not null check (url like 'https://%' and length(url) <= 2048),
  secret_encrypted text not null,
  token_encrypted text,
  events text[] not null check (cardinality(events) between 1 and 40),
  include_customer boolean not null default false,
  enabled boolean not null default true,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id,store_id)
);
create index if not exists store_webhook_endpoints_store_idx on public.store_webhook_endpoints(store_id);

create table if not exists public.store_webhook_events (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  type text not null,
  entity_id text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  unique (id,store_id)
);
create index if not exists store_webhook_events_store_idx on public.store_webhook_events(store_id,created_at desc);

create table if not exists public.store_webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  endpoint_id uuid not null,
  event_id uuid not null,
  endpoint_version integer not null,
  status text not null default 'pending' check (status in ('pending','processing','delivered','failed','cancelled')),
  attempts integer not null default 0 check (attempts between 0 and 8),
  sequence bigint generated always as identity,
  next_attempt_at timestamptz not null default now(),
  leased_until timestamptz,
  lease_token uuid,
  http_status integer,
  last_error text,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (endpoint_id,store_id) references public.store_webhook_endpoints(id,store_id) on delete cascade,
  foreign key (event_id,store_id) references public.store_webhook_events(id,store_id) on delete cascade,
  unique (endpoint_id,event_id)
);
create index if not exists store_webhook_deliveries_due_idx on public.store_webhook_deliveries(next_attempt_at) where status in ('pending','processing');
create index if not exists store_webhook_deliveries_store_idx on public.store_webhook_deliveries(store_id,created_at desc);

alter table public.store_webhook_endpoints enable row level security;
alter table public.store_webhook_events enable row level security;
alter table public.store_webhook_deliveries enable row level security;
-- Secrets and raw event payloads are available only to server-side code.
revoke all on public.store_webhook_endpoints, public.store_webhook_events, public.store_webhook_deliveries from public,anon,authenticated;
grant all on public.store_webhook_endpoints, public.store_webhook_events, public.store_webhook_deliveries to service_role;
grant usage,select on sequence public.store_webhook_deliveries_sequence_seq to service_role;

create or replace function public.store_webhook_endpoint_limit() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  -- Serializa criacoes por loja para impedir ultrapassar o limite em paralelo.
  perform 1 from public.stores where id=new.store_id for update;
  if (select count(*) from public.store_webhook_endpoints where store_id=new.store_id)>=10 then
    raise exception 'Cada loja pode ter ate 10 integracoes.' using errcode='23514';
  end if;
  return new;
end $$;
revoke all on function public.store_webhook_endpoint_limit() from public,anon,authenticated;
drop trigger if exists store_webhook_endpoint_limit on public.store_webhook_endpoints;
create trigger store_webhook_endpoint_limit before insert on public.store_webhook_endpoints
for each row execute function public.store_webhook_endpoint_limit();

create or replace function public.store_webhook_endpoint_version() returns trigger
language plpgsql set search_path = public as $$
begin
  new.version := old.version + 1;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists store_webhook_endpoint_version on public.store_webhook_endpoints;
create trigger store_webhook_endpoint_version before update on public.store_webhook_endpoints
for each row execute function public.store_webhook_endpoint_version();

create or replace function public.emit_store_webhook(p_store uuid,p_type text,p_entity text,p_data jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare event_id uuid;
begin
  if not exists (select 1 from public.store_webhook_endpoints where store_id=p_store and enabled and p_type=any(events)) then return null; end if;
  insert into public.store_webhook_events(store_id,type,entity_id,data) values(p_store,p_type,p_entity,p_data) returning id into event_id;
  insert into public.store_webhook_deliveries(store_id,endpoint_id,event_id,endpoint_version)
  select p_store,id,event_id,version from public.store_webhook_endpoints where store_id=p_store and enabled and p_type=any(events);
  return event_id;
end $$;
revoke all on function public.emit_store_webhook(uuid,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.emit_store_webhook(uuid,text,text,jsonb) to service_role;

create or replace function public.capture_store_webhook() returns trigger
language plpgsql security definer set search_path = public as $$
declare r jsonb; previous jsonb; snapshot jsonb; old_snapshot jsonb; sid uuid; topic text; entity text; prefix text:=tg_argv[0];
begin
  r := case when tg_op='DELETE' then to_jsonb(old) else to_jsonb(new) end;
  previous := case when tg_op='UPDATE' then to_jsonb(old) else '{}'::jsonb end;
  sid := (r->>'store_id')::uuid;
  if sid is null or not exists(select 1 from public.stores where id=sid) then return null; end if;
  entity := coalesce(r->>'id',r->>'order_nsu');
  if prefix='order' then
    -- Explicit allowlist; never serialize private payment credentials or arbitrary columns.
    snapshot := jsonb_build_object('id',r->'id','status',r->'status','total_amount',r->'total_amount','subtotal_amount',r->'subtotal_amount',
      'payment_method',r->'payment_method','is_plr_purchase',r->'is_plr_purchase','created_at',r->'created_at','paid_at',r->'paid_at',
      'platform_fee_amount',r->'platform_fee_amount','asaas_fee_amount',r->'asaas_fee_amount','creator_net_amount',r->'creator_net_amount','tracking_parameters',r->'tracking_parameters');
    if tg_op='INSERT' then topic:='order.created';
    elsif tg_op='DELETE' then return null;
    elsif r->>'status' is distinct from previous->>'status' then
      topic:=case r->>'status' when 'paid' then 'order.paid' when 'refunded' then 'order.refunded' when 'cancelled' then 'order.cancelled' when 'failed' then 'order.failed' when 'expired' then 'order.expired' when 'chargedback' then 'order.chargedback' else 'order.updated' end;
    else return null; end if;
  elsif prefix='product' then
    snapshot:=jsonb_build_object('id',r->'id','title',r->'titulo','slug',r->'slug','description',left(r->>'descricao',5000),'status',r->'status',
      'price',r->'preco','plr_price',r->'preco_plr','is_plr',r->'is_plr','is_free',r->'is_free','cover_url',r->'capa_url','type',r->'tipo',
      'category_ids',r->'category_ids','education_level_ids',r->'education_level_ids','tags',r->'tags','seasonal_tags',r->'seasonal_tags','deleted_at',r->'excluido_em');
    old_snapshot:=jsonb_build_object('id',previous->'id','title',previous->'titulo','slug',previous->'slug','description',left(previous->>'descricao',5000),'status',previous->'status',
      'price',previous->'preco','plr_price',previous->'preco_plr','is_plr',previous->'is_plr','is_free',previous->'is_free','cover_url',previous->'capa_url','type',previous->'tipo',
      'category_ids',previous->'category_ids','education_level_ids',previous->'education_level_ids','tags',previous->'tags','seasonal_tags',previous->'seasonal_tags','deleted_at',previous->'excluido_em');
    if tg_op='UPDATE' and snapshot=old_snapshot then return null; end if;
    topic:=case when tg_op='DELETE' or (r->>'excluido_em' is not null and previous->>'excluido_em' is null) then 'product.deleted'
      when tg_op='INSERT' then 'product.created'
      when r->>'status' in ('publicado','ativo','published') and coalesce(previous->>'status','') not in ('publicado','ativo','published') then 'product.published'
      when coalesce(previous->>'status','') in ('publicado','ativo','published') and coalesce(r->>'status','') not in ('publicado','ativo','published') then 'product.unpublished' else 'product.updated' end;
  else
    snapshot:=jsonb_build_object('id',r->'id','name',coalesce(r->'name',r->'titulo'),'status',r->'status','created_at',r->'created_at','paid_at',r->'paid_at',
      'price',coalesce(r->'gross_amount',r->'monthly_price',r->'preco_kit'),'expires_at',r->'expires_at');
    if tg_op='UPDATE' and r->>'status' is not distinct from previous->>'status' and r->>'expires_at' is not distinct from previous->>'expires_at' then return null; end if;
    topic:=prefix||case when tg_op='INSERT' then '.created' when tg_op='DELETE' then '.deleted' else '.updated' end;
  end if;
  perform public.emit_store_webhook(sid,topic,entity,snapshot);
  return null;
end $$;
revoke all on function public.capture_store_webhook() from public,anon,authenticated;

drop trigger if exists capture_store_webhook on public.orders;
create trigger capture_store_webhook after insert or update on public.orders for each row execute function public.capture_store_webhook('order');
drop trigger if exists capture_store_webhook on public.products;
create trigger capture_store_webhook after insert or update or delete on public.products for each row execute function public.capture_store_webhook('product');
do $$ declare item record; begin
  for item in select * from (values ('kits','kit'),('creator_clubs','club'),('creator_club_subscriptions','subscription'),('creator_club_payments','club_payment')) as t(tbl,prefix) loop
    if to_regclass('public.'||item.tbl) is not null then
      execute format('drop trigger if exists capture_store_webhook on public.%I',item.tbl);
      execute format('create trigger capture_store_webhook after insert or update or delete on public.%I for each row execute function public.capture_store_webhook(%L)',item.tbl,item.prefix);
    end if;
  end loop;
end $$;

create or replace function public.claim_store_webhook_deliveries(p_limit integer default 5,p_store uuid default null)
returns setof public.store_webhook_deliveries language plpgsql security definer set search_path=public as $$
begin
  update public.store_webhook_deliveries d set status='cancelled',leased_until=null,lease_token=null,last_error='config_changed'
  from public.store_webhook_endpoints ep where ep.id=d.endpoint_id and (ep.version<>d.endpoint_version or not ep.enabled)
    and (d.status='pending' or (d.status='processing' and d.leased_until<now())) and (p_store is null or d.store_id=p_store);
  update public.store_webhook_deliveries set status='failed',leased_until=null,lease_token=null,last_error='attempts_exhausted'
    where attempts>=8 and (status='pending' or (status='processing' and leased_until<now())) and (p_store is null or store_id=p_store);
  return query
  with picked as (
    select d.id from public.store_webhook_deliveries d
    join public.store_webhook_events e on e.id=d.event_id and e.store_id=d.store_id
    join public.store_webhook_endpoints ep on ep.id=d.endpoint_id and ep.store_id=d.store_id and ep.enabled and ep.version=d.endpoint_version
    where d.attempts<8 and d.next_attempt_at<=now() and (d.status='pending' or (d.status='processing' and d.leased_until<now()))
      and (p_store is null or d.store_id=p_store)
      and not exists(select 1 from public.store_webhook_deliveries earlier join public.store_webhook_events ee on ee.id=earlier.event_id
        where earlier.endpoint_id=d.endpoint_id and earlier.endpoint_version=d.endpoint_version and ee.entity_id=e.entity_id
          and earlier.status in ('pending','processing') and earlier.sequence<d.sequence)
    order by d.sequence limit greatest(1,least(p_limit,10)) for update of d skip locked
  ) update public.store_webhook_deliveries d set status='processing',attempts=d.attempts+1,leased_until=now()+interval '90 seconds',lease_token=gen_random_uuid()
    from picked where d.id=picked.id returning d.*;
end $$;
revoke all on function public.claim_store_webhook_deliveries(integer,uuid) from public,anon,authenticated;
grant execute on function public.claim_store_webhook_deliveries(integer,uuid) to service_role;

commit;
