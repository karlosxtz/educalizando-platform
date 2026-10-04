-- Chaves privadas por loja para integrações de atendimento (n8n e chatbots).
-- Somente o hash é persistido. A chave completa aparece uma única vez ao criador.

create table if not exists public.store_chatbot_api_keys (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null unique references public.stores(id) on delete cascade,
  creator_id uuid not null references auth.users(id) on delete cascade,
  key_hash text not null unique check (char_length(key_hash) = 64),
  key_prefix text not null,
  last_four text not null check (char_length(last_four) = 4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create index if not exists store_chatbot_api_keys_active_hash_idx
  on public.store_chatbot_api_keys(key_hash)
  where revoked_at is null;

alter table public.store_chatbot_api_keys enable row level security;

-- Não há políticas para clientes. Leitura e gravação acontecem exclusivamente
-- nas rotas protegidas do servidor usando a service role.
revoke all on table public.store_chatbot_api_keys from anon, authenticated;

comment on table public.store_chatbot_api_keys is
  'Chaves privadas de leitura do catálogo de uma única loja para chatbots e n8n.';
comment on column public.store_chatbot_api_keys.key_hash is
  'SHA-256 da chave; o token completo nunca é armazenado.';

notify pgrst, 'reload schema';
