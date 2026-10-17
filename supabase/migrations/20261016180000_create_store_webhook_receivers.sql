-- EDUCALIZANDO: recebimento privado por loja.
-- Execute o arquivo inteiro. Nao altera saldos, comissoes ou pagamentos internos.
begin;

create table if not exists public.store_webhook_receivers (
 id uuid primary key default gen_random_uuid(), store_id uuid not null references public.stores(id) on delete cascade,
 name text not null check(length(name) between 1 and 100), enabled boolean not null default true,
 permissions text[] not null default array['events.receive']::text[] check(permissions <@ array['events.receive','products.write','categories.write','customers.write','orders.write','access.manage']::text[] and 'events.receive'=any(permissions)),
 token_hash text not null check(token_hash ~ '^[0-9a-f]{64}$'), token_encrypted text not null,
 archived_at timestamptz, created_at timestamptz not null default now(), unique(id,store_id),
 check(not 'access.manage'=any(permissions) or 'orders.write'=any(permissions))
);
create index if not exists webhook_receivers_store_idx on public.store_webhook_receivers(store_id);
create table if not exists public.store_webhook_received_events (
 id uuid primary key default gen_random_uuid(), receiver_id uuid not null, store_id uuid not null,
 external_id text not null check(length(external_id) between 1 and 120), type text not null check(length(type) between 1 and 100),
 data jsonb not null check(octet_length(data::text)<=65536), payload_hash text not null,
 is_test boolean not null default false, occurred_at timestamptz not null default now(),
 status text not null default 'received' check(status in('received','processed','ignored','failed','test')),
 result jsonb not null default '{}'::jsonb, error_code text, attempts integer not null default 0,
 created_at timestamptz not null default now(), unique(receiver_id,external_id),
 foreign key(receiver_id,store_id) references public.store_webhook_receivers(id,store_id) on delete cascade
);
create index if not exists webhook_received_store_idx on public.store_webhook_received_events(store_id,created_at desc);
create table if not exists public.store_webhook_entity_links (
 receiver_id uuid not null, store_id uuid not null, kind text not null check(kind in('product','category')),
 external_id text not null, entity_id uuid not null, occurred_at timestamptz not null,
 primary key(receiver_id,kind,external_id),
 foreign key(receiver_id,store_id) references public.store_webhook_receivers(id,store_id) on delete cascade
);
create table if not exists public.store_external_contacts (
 id uuid primary key default gen_random_uuid(), receiver_id uuid not null, store_id uuid not null, external_id text not null,
 name text not null, email text not null, phone text, marketing_consent boolean not null default false,
 occurred_at timestamptz not null, updated_at timestamptz not null default now(), unique(receiver_id,external_id),
 foreign key(receiver_id,store_id) references public.store_webhook_receivers(id,store_id) on delete cascade
);
create table if not exists public.store_external_orders (
 id uuid primary key default gen_random_uuid(), receiver_id uuid not null, store_id uuid not null, external_id text not null,
 status text not null check(status in('pending','paid','cancelled','failed','refunded','chargedback')),
 email text not null, customer_name text not null default '', total_amount numeric(12,2) not null check(total_amount>=0),
 currency text not null default 'BRL', items jsonb not null, occurred_at timestamptz not null,
 updated_at timestamptz not null default now(), unique(receiver_id,external_id), unique(id,store_id),
 foreign key(receiver_id,store_id) references public.store_webhook_receivers(id,store_id) on delete restrict
);
create table if not exists public.store_external_access_grants (
 id uuid primary key default gen_random_uuid(), store_id uuid not null, external_order_id uuid not null,
 product_id uuid not null references public.products(id) on delete restrict, email text not null, student_id text,
 access_id varchar(64) not null unique default ('ext_'||gen_random_uuid()::text),
 status text not null check(status in('pending','active','revoked')), created_at timestamptz not null default now(),
 unique(external_order_id,product_id), foreign key(external_order_id,store_id) references public.store_external_orders(id,store_id) on delete restrict
);
create index if not exists external_grants_email_idx on public.store_external_access_grants(lower(email)) where status='pending';
create index if not exists external_orders_store_idx on public.store_external_orders(store_id,updated_at desc);
create index if not exists external_contacts_store_idx on public.store_external_contacts(store_id,updated_at desc);

do $$ declare tbl text; begin
 foreach tbl in array array['store_webhook_receivers','store_webhook_received_events','store_webhook_entity_links','store_external_contacts','store_external_orders','store_external_access_grants'] loop
  execute format('alter table public.%I enable row level security',tbl);
  execute format('revoke all on public.%I from public,anon,authenticated',tbl);
  execute format('grant all on public.%I to service_role',tbl);
 end loop;
end $$;

create or replace function public.webhook_receiver_limit() returns trigger language plpgsql security definer set search_path=public as $$
begin
 perform 1 from public.stores where id=new.store_id for update;
 if (select count(*) from public.store_webhook_receivers where store_id=new.store_id and archived_at is null)>=10 then raise exception 'receiver_limit' using errcode='23514'; end if;
 return new;
end $$;
revoke all on function public.webhook_receiver_limit() from public,anon,authenticated;
drop trigger if exists webhook_receiver_limit on public.store_webhook_receivers;
create trigger webhook_receiver_limit before insert on public.store_webhook_receivers for each row execute function public.webhook_receiver_limit();

create or replace function public.webhook_receiver_archive_guard() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if old.archived_at is null and new.archived_at is not null and exists(select 1 from public.store_external_orders where receiver_id=new.id) then
  raise exception 'external_orders_require_pause' using errcode='23503';
 end if;
 if new.archived_at is not null then new.enabled:=false; end if;
 return new;
end $$;
revoke all on function public.webhook_receiver_archive_guard() from public,anon,authenticated;
drop trigger if exists webhook_receiver_archive_guard on public.store_webhook_receivers;
create trigger webhook_receiver_archive_guard before update of archived_at on public.store_webhook_receivers for each row execute function public.webhook_receiver_archive_guard();

create or replace function public.sync_external_webhook_access(p_order uuid,p_enable boolean) returns integer
language plpgsql security definer set search_path=public as $$
declare ord public.store_external_orders; item jsonb; pid uuid; uid text; grant_row public.store_external_access_grants; affected integer:=0;
begin
 select * into ord from public.store_external_orders where id=p_order for update;
 if not found then raise exception 'external_order_missing' using errcode='22023'; end if;
 if not p_enable then
  update public.student_product_access a set status='REVOKED' from public.store_external_access_grants g
   where g.external_order_id=ord.id and a.id=g.access_id and a.store_id=ord.store_id::text;
  update public.store_external_access_grants set status='revoked' where external_order_id=ord.id;
  get diagnostics affected=row_count; return affected;
 end if;
 if ord.status<>'paid' then raise exception 'external_order_not_paid' using errcode='22023'; end if;
 select u.id::text into uid from auth.users u where lower(u.email)=lower(ord.email) and u.email_confirmed_at is not null limit 1;
 for item in select value from jsonb_array_elements(ord.items) loop
  pid:=(item->>'product_id')::uuid;
  if not exists(select 1 from public.products where id=pid and store_id=ord.store_id and status='publicado' and excluido_em is null) then raise exception 'own_published_material_required' using errcode='22023'; end if;
  insert into public.store_external_access_grants(store_id,external_order_id,product_id,email,student_id,status)
   values(ord.store_id,ord.id,pid,ord.email,uid,case when uid is null then 'pending' else 'active' end)
   on conflict(external_order_id,product_id) do update set status=excluded.status,student_id=excluded.student_id returning * into grant_row;
  if uid is not null then
   insert into public.student_product_access(id,student_id,product_id,store_id,status,granted_at)
    values(grant_row.access_id,uid,pid::text,ord.store_id::text,'ACTIVE',now())
    on conflict(id) do update set status='ACTIVE',student_id=excluded.student_id;
  end if;
  affected:=affected+1;
 end loop;
 return affected;
end $$;
revoke all on function public.sync_external_webhook_access(uuid,boolean) from public,anon,authenticated;
grant execute on function public.sync_external_webhook_access(uuid,boolean) to service_role;

-- Somente o proprio usuario com email confirmado pode vincular uma liberacao pendente.
create or replace function public.claim_external_store_access() returns integer
language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); mail text; row public.store_external_access_grants; affected integer:=0;
begin
 if uid is null then return 0; end if;
 select lower(email) into mail from auth.users where id=uid and email_confirmed_at is not null;
 if mail is null then return 0; end if;
 for row in select g.* from public.store_external_access_grants g join public.store_external_orders o on o.id=g.external_order_id
  join public.products p on p.id=g.product_id and p.store_id=g.store_id
  where lower(g.email)=mail and g.status='pending' and g.student_id is null and o.status='paid' and p.status='publicado' and p.excluido_em is null
  for update of g skip locked loop
   insert into public.student_product_access(id,student_id,product_id,store_id,status,granted_at)
    values(row.access_id,uid::text,row.product_id::text,row.store_id::text,'ACTIVE',now()) on conflict(id) do nothing;
   update public.store_external_access_grants set student_id=uid::text,status='active' where id=row.id;
   affected:=affected+1;
 end loop;
 return affected;
end $$;
revoke all on function public.claim_external_store_access() from public,anon;
grant execute on function public.claim_external_store_access() to authenticated,service_role;

create or replace function public.receive_store_webhook(p_receiver uuid,p_token_hash text,p_event_id text,p_type text,p_occurred timestamptz,p_data jsonb,p_hash text,p_test boolean default false)
returns jsonb language plpgsql security definer set search_path=public as $$
declare r public.store_webhook_receivers; ev public.store_webhook_received_events; required_permission text; t timestamptz;
 target uuid; link_row public.store_webhook_entity_links; prod public.products; ord public.store_external_orders; previous_order public.store_external_orders;
 item jsonb; normalized_items jsonb:='[]'; v_result jsonb:='{}'; next_status text:='processed'; n integer; item_id uuid;
begin
 select * into r from public.store_webhook_receivers where id=p_receiver for update;
 if not found or not r.enabled or r.archived_at is not null or r.token_hash<>p_token_hash then raise exception 'receiver_unauthorized' using errcode='42501'; end if;
 if length(p_event_id) not between 1 and 120 or length(p_type) not between 1 and 100 or octet_length(p_data::text)>65536 or jsonb_typeof(p_data)<>'object' then raise exception 'invalid_event' using errcode='22023'; end if;
 select * into ev from public.store_webhook_received_events where receiver_id=r.id and external_id=p_event_id for update;
 if found then
  if ev.payload_hash<>p_hash then return jsonb_build_object('success',false,'error_code','event_id_conflict','event_id',ev.id); end if;
  if ev.status in('processed','ignored','test') then return jsonb_build_object('success',true,'duplicate',true,'event_id',ev.id,'status',ev.status,'result',ev.result); end if;
  if ev.attempts>=8 then return jsonb_build_object('success',false,'error_code','attempts_exhausted','event_id',ev.id); end if;
 else
  insert into public.store_webhook_received_events(receiver_id,store_id,external_id,type,data,payload_hash,is_test,occurred_at)
   values(r.id,r.store_id,p_event_id,p_type,p_data,p_hash,p_test,coalesce(p_occurred,now())) returning * into ev;
 end if;
 t:=ev.occurred_at;
 begin
  perform set_config('educalizando.webhook_receiver',r.id::text,true);
  required_permission:=case p_type when 'product.upsert' then 'products.write' when 'category.upsert' then 'categories.write' when 'customer.upsert' then 'customers.write' when 'order.upsert' then 'orders.write' when 'access.grant' then 'access.manage' when 'access.revoke' then 'access.manage' else 'events.receive' end;
  if not p_test and not required_permission=any(r.permissions) then raise exception 'permission_not_enabled' using errcode='42501'; end if;
  -- O contrato normalizado nao permite gravar campos de saldo, cobranca ou arquivos privados.
  if p_test then next_status:='test'; v_result:=jsonb_build_object('message','Teste interno recebido, sem alterar cadastros.');
  elsif p_type in('product.upsert','category.upsert') then
   select * into link_row from public.store_webhook_entity_links where receiver_id=r.id and kind=case when p_type='product.upsert' then 'product' else 'category' end and external_id=p_data->>'external_id';
   if found and link_row.occurred_at>=t then next_status:='ignored'; v_result:=jsonb_build_object('message','Aviso mais antigo que o cadastro atual.');
   elsif p_type='product.upsert' then
    target:=coalesce((p_data->>'product_id')::uuid,link_row.entity_id);
    if link_row.entity_id is not null and target<>link_row.entity_id then raise exception 'mapping_conflict' using errcode='22023'; end if;
    if target is not null then
     select * into prod from public.products where id=target and store_id=r.store_id and excluido_em is null for update;
     if not found then raise exception 'own_material_required' using errcode='22023'; end if;
     if prod.updated_at>t then next_status:='ignored'; v_result:=jsonb_build_object('product_id',target,'message','Uma alteracao mais recente foi preservada.'); end if;
    end if;
    if next_status<>'ignored' then
     if p_data ? 'category_ids' and exists(select 1 from jsonb_array_elements_text(p_data->'category_ids') x where not exists(select 1 from public.categories c where c.id=x.value::uuid and (c.store_id=r.store_id or c.store_id is null))) then raise exception 'invalid_category_scope' using errcode='22023'; end if;
     if p_data ? 'education_level_ids' and exists(select 1 from jsonb_array_elements_text(p_data->'education_level_ids') x where not exists(select 1 from public.education_levels l where l.id=x.value::uuid)) then raise exception 'invalid_education_level' using errcode='22023'; end if;
     if target is null then
      target:=gen_random_uuid();
      insert into public.products(id,store_id,titulo,descricao,preco,tipo,status,slug) values(target,r.store_id,p_data->>'title',coalesce(p_data->>'description',''),coalesce((p_data->>'price')::numeric,0),coalesce(p_data->>'format','pdf'),'rascunho','importado-'||target::text);
     end if;
     update public.products set titulo=p_data->>'title',descricao=case when p_data ? 'description' then p_data->>'description' else descricao end,
      preco=case when p_data ? 'price' then (p_data->>'price')::numeric else preco end,
      is_free=case when p_data ? 'price' then (p_data->>'price')::numeric=0 else is_free end,
      preco_original=case when p_data ? 'price' and ((p_data->>'price')::numeric=0 or preco_original<=(p_data->>'price')::numeric) then null else preco_original end,
      tipo=coalesce(p_data->>'format',tipo),
      capa_url=case when p_data ? 'cover_url' then p_data->>'cover_url' else capa_url end,
      tags=case when p_data ? 'tags' then array(select jsonb_array_elements_text(p_data->'tags')) else tags end,
      seasonal_tags=case when p_data ? 'seasonal_tags' then array(select jsonb_array_elements_text(p_data->'seasonal_tags')) else seasonal_tags end,
      category_ids=case when p_data ? 'category_ids' then array(select x::uuid from jsonb_array_elements_text(p_data->'category_ids') x) else category_ids end,
      category_id=case when p_data ? 'category_ids' then (p_data->'category_ids'->>0)::uuid else category_id end,
      education_level_ids=case when p_data ? 'education_level_ids' then array(select x::uuid from jsonb_array_elements_text(p_data->'education_level_ids') x) else education_level_ids end,
      education_level_id=case when p_data ? 'education_level_ids' then (p_data->'education_level_ids'->>0)::uuid else education_level_id end,
      page_count=case when p_data ? 'page_count' then (p_data->>'page_count')::integer else page_count end,
      age_range=coalesce(p_data->>'age_range',age_range),format_details=coalesce(p_data->>'format_details',format_details),
      color_mode=coalesce(p_data->>'color_mode',color_mode),updated_at=now() where id=target and store_id=r.store_id;
     v_result:=jsonb_build_object('product_id',target,'message','Cadastro salvo; novos materiais ficam em rascunho.');
    end if;
   else
    target:=coalesce((p_data->>'category_id')::uuid,link_row.entity_id);
    if link_row.entity_id is not null and target<>link_row.entity_id then raise exception 'mapping_conflict' using errcode='22023'; end if;
    if target is not null and not exists(select 1 from public.categories where id=target and store_id=r.store_id) then raise exception 'own_category_required' using errcode='22023'; end if;
    if target is null then target:=gen_random_uuid(); insert into public.categories(id,store_id,nome,slug) values(target,r.store_id,p_data->>'name','importada-'||target::text);
    else update public.categories set nome=p_data->>'name' where id=target and store_id=r.store_id; end if;
    v_result:=jsonb_build_object('category_id',target,'message','Categoria da loja salva.');
   end if;
   if next_status<>'ignored' then
    insert into public.store_webhook_entity_links(receiver_id,store_id,kind,external_id,entity_id,occurred_at)
     values(r.id,r.store_id,case when p_type='product.upsert' then 'product' else 'category' end,p_data->>'external_id',target,t)
     on conflict(receiver_id,kind,external_id) do update set occurred_at=excluded.occurred_at;
   end if;
  elsif p_type='customer.upsert' then
   insert into public.store_external_contacts(receiver_id,store_id,external_id,name,email,phone,marketing_consent,occurred_at)
    values(r.id,r.store_id,p_data->>'external_id',p_data->>'name',lower(p_data->>'email'),p_data->>'phone',coalesce((p_data->>'marketing_consent')::boolean,false),t)
    on conflict(receiver_id,external_id) do update set name=excluded.name,email=excluded.email,phone=excluded.phone,marketing_consent=excluded.marketing_consent,occurred_at=excluded.occurred_at,updated_at=now()
    where public.store_external_contacts.occurred_at<excluded.occurred_at;
   v_result:=jsonb_build_object('message','Cliente registrado na area de recebimentos.');
  elsif p_type='order.upsert' then
   select * into previous_order from public.store_external_orders where receiver_id=r.id and external_id=p_data->>'external_id' for update;
   if found and (previous_order.occurred_at>=t or previous_order.status in('refunded','chargedback') or previous_order.status='paid' and p_data->>'status' in('pending','failed','cancelled')) then next_status:='ignored'; v_result:=jsonb_build_object('message','Uma situacao mais recente ou final do pedido foi preservada.');
   else
    for item in select value from jsonb_array_elements(p_data->'items') loop
     item_id:=(item->>'product_id')::uuid;
     if item_id is null then select entity_id into item_id from public.store_webhook_entity_links where receiver_id=r.id and kind='product' and external_id=item->>'external_product_id'; end if;
     if item_id is null or not exists(select 1 from public.products where id=item_id and store_id=r.store_id and excluido_em is null) then raise exception 'own_material_required' using errcode='22023'; end if;
     normalized_items:=normalized_items||jsonb_build_array(jsonb_build_object('product_id',item_id,'quantity',item->'quantity'));
    end loop;
    if previous_order.status='paid' and (previous_order.email<>lower(p_data->>'email') or previous_order.items<>normalized_items or previous_order.total_amount<>(p_data->>'total_amount')::numeric or previous_order.currency<>p_data->>'currency') then raise exception 'paid_order_immutable' using errcode='22023'; end if;
    insert into public.store_external_orders(receiver_id,store_id,external_id,status,email,customer_name,total_amount,currency,items,occurred_at)
     values(r.id,r.store_id,p_data->>'external_id',p_data->>'status',lower(p_data->>'email'),coalesce(p_data->>'customer_name',''),(p_data->>'total_amount')::numeric,coalesce(p_data->>'currency','BRL'),normalized_items,t)
     on conflict(receiver_id,external_id) do update set status=excluded.status,email=excluded.email,customer_name=excluded.customer_name,total_amount=excluded.total_amount,currency=excluded.currency,items=excluded.items,occurred_at=excluded.occurred_at,updated_at=now() returning * into ord;
    if ord.status in('refunded','chargedback') then n:=public.sync_external_webhook_access(ord.id,false);
    elsif coalesce((p_data->>'grant_access')::boolean,false) then
     if not 'access.manage'=any(r.permissions) then raise exception 'access_permission_required' using errcode='42501'; end if;
     n:=public.sync_external_webhook_access(ord.id,true);
    end if;
    v_result:=jsonb_build_object('external_order_id',ord.id,'access_count',coalesce(n,0),'message','Venda externa registrada; sem saldo ou cobranca interna.');
   end if;
  elsif p_type in('access.grant','access.revoke') then
   select * into ord from public.store_external_orders where receiver_id=r.id and external_id=p_data->>'external_order_id' for update;
   if not found then raise exception 'external_order_missing' using errcode='22023'; end if;
   n:=public.sync_external_webhook_access(ord.id,p_type='access.grant');
   v_result:=jsonb_build_object('external_order_id',ord.id,'access_count',n,'message',case when p_type='access.grant' then 'Acessos registrados para o email do comprador.' else 'Acessos desta venda externa revogados.' end);
  else v_result:=jsonb_build_object('message','Aviso recebido e registrado, sem alterar cadastros.');
  end if;
  update public.store_webhook_received_events set status=next_status,result=v_result,error_code=null,attempts=attempts+1 where id=ev.id;
  return jsonb_build_object('success',true,'event_id',ev.id,'status',next_status,'result',v_result);
 exception when others then
  update public.store_webhook_received_events set status='failed',error_code=sqlstate,attempts=attempts+1 where id=ev.id;
  return jsonb_build_object('success',false,'event_id',ev.id,'error_code',sqlstate);
 end;
end $$;
revoke all on function public.receive_store_webhook(uuid,text,text,text,timestamptz,jsonb,text,boolean) from public,anon,authenticated;
grant execute on function public.receive_store_webhook(uuid,text,text,text,timestamptz,jsonb,text,boolean) to service_role;
-- Evita ciclos: alteracoes recebidas nao sao retransmitidas automaticamente.
create or replace function public.capture_store_webhook() returns trigger
language plpgsql security definer set search_path = public as $$
declare r jsonb; previous jsonb; snapshot jsonb; old_snapshot jsonb; sid uuid; topic text; entity text; prefix text:=tg_argv[0];
begin
  if nullif(current_setting('educalizando.webhook_receiver',true),'') is not null then return null; end if;
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
commit;
