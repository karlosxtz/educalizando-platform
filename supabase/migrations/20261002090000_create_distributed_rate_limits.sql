create table if not exists public.api_rate_limits (
  rate_key text primary key,
  hit_count integer not null default 0 check (hit_count >= 0),
  reset_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table public.api_rate_limits enable row level security;

create or replace function public.consume_api_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns table (allowed boolean, remaining integer, retry_after_seconds integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_row public.api_rate_limits%rowtype;
  current_time timestamptz := clock_timestamp();
begin
  if p_key is null or length(p_key) > 180 or p_limit < 1 or p_window_seconds < 1 then
    raise exception 'Parâmetros de limite inválidos';
  end if;

  insert into public.api_rate_limits (rate_key, hit_count, reset_at, updated_at)
  values (p_key, 1, current_time + make_interval(secs => p_window_seconds), current_time)
  on conflict (rate_key) do update
  set hit_count = case when public.api_rate_limits.reset_at <= current_time then 1 else public.api_rate_limits.hit_count + 1 end,
      reset_at = case when public.api_rate_limits.reset_at <= current_time then current_time + make_interval(secs => p_window_seconds) else public.api_rate_limits.reset_at end,
      updated_at = current_time
  returning * into current_row;

  return query select
    current_row.hit_count <= p_limit,
    greatest(0, p_limit - current_row.hit_count),
    greatest(1, ceil(extract(epoch from (current_row.reset_at - current_time)))::integer);
end;
$$;

revoke all on table public.api_rate_limits from public, anon, authenticated;
revoke all on function public.consume_api_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text, integer, integer) to service_role;

create index if not exists api_rate_limits_reset_at_idx on public.api_rate_limits (reset_at);
