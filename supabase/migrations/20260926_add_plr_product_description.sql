-- Descrição separada da oferta de licença PLR. Produtos existentes permanecem inalterados.
alter table public.products
  add column if not exists plr_descricao text;

comment on column public.products.plr_descricao is
  'Descrição exclusiva da oferta de licença PLR; descricao continua sendo a descrição do produto final.';
