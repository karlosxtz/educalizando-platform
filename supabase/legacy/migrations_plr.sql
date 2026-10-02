-- Adiciona suporte para PLR na tabela de produtos
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_plr BOOLEAN DEFAULT false;

-- Atualiza a política de visualização pública para garantir que produtos PLR também possam ser visualizados
-- A política atual 'Produtos publicados são visíveis publicamente' já resolve,
-- mas podemos criar um índice para facilitar a busca do marketplace.
CREATE INDEX IF NOT EXISTS idx_products_is_plr ON public.products(is_plr);
