-- Histórico idempotente dos envios ligados a pedidos.
-- O pedido pode receber webhooks repetidos, mas cada canal/evento só é enviado
-- uma vez quando concluído. Falhas ficam registradas para reprocessamento.
create table if not exists public.transactional_delivery_attempts (
  id uuid primary key default gen_random_uuid(),
  order_id text not null,
  channel text not null check (channel in ('EMAIL', 'WHATSAPP')),
  event_type text not null check (event_type in ('PAYMENT_CONFIRMED', 'MATERIAL_DELIVERY', 'CREATOR_SALE_ALERT')),
  status text not null check (status in ('PROCESSING', 'SENT', 'FAILED')),
  attempts integer not null default 1 check (attempts > 0),
  provider_message_id text,
  last_error text,
  last_attempt_at timestamptz not null default now(),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transactional_delivery_attempts_once unique (order_id, channel, event_type)
);

create index if not exists transactional_delivery_attempts_retry_idx
  on public.transactional_delivery_attempts (status, last_attempt_at asc)
  where status = 'FAILED';

alter table public.transactional_delivery_attempts enable row level security;

-- Somente operações server-side com service role gerenciam este histórico.
