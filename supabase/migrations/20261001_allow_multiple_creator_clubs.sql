-- Permite vários clubes por loja sem alterar clubes, assinaturas ou pagamentos existentes.
alter table public.creator_clubs drop constraint if exists creator_clubs_store_id_key;
create index if not exists creator_clubs_store_status_idx on public.creator_clubs(store_id, status, created_at desc);

