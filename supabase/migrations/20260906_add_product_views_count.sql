-- Adiciona coluna views_count na tabela products
ALTER TABLE public.products ADD COLUMN views_count INTEGER DEFAULT 0;

-- Cria função (RPC) segura para incrementar o contador de visualizações
-- Usamos SECURITY DEFINER para permitir que usuários anônimos consigam somar +1, 
-- ignorando políticas rigorosas de RLS no UPDATE da tabela products.
CREATE OR REPLACE FUNCTION public.increment_product_views(p_product_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.products
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
