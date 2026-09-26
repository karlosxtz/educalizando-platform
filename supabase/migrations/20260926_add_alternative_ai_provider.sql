alter table public.store_secrets
  add column if not exists openrouter_ai_key text,
  add column if not exists ai_provider text not null default 'primary'
    check (ai_provider in ('primary', 'alternative'));

comment on column public.store_secrets.openrouter_ai_key is 'Chave da integração alternativa de IA.';
comment on column public.store_secrets.ai_provider is 'Integração de IA ativa para a loja.';
