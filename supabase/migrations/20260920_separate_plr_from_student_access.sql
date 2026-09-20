-- PLR é uma licença B2B do painel do criador. Compras PLR antigas podem ter
-- recebido, por um fluxo legado, uma linha na biblioteca de aluno. Elas devem
-- continuar disponíveis somente em /dashboard/plr/comprados.
DELETE FROM public.student_product_access AS access
USING public.orders AS purchase
WHERE access.order_id = purchase.id
  AND purchase.is_plr_purchase IS TRUE;

-- Ajuda as leituras do CRM a localizar apenas compras finais sem varrer toda
-- a tabela de pedidos. A condição parcial mantém o índice compacto.
CREATE INDEX IF NOT EXISTS idx_orders_store_final_purchases
  ON public.orders (store_id, created_at DESC)
  WHERE is_plr_purchase IS FALSE OR is_plr_purchase IS NULL;
