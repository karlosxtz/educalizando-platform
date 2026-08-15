-- =============================================================================
-- EDUCALIZANDO — MIGRATION DE CORREÇÃO CRÍTICA P0-2: RLS EM ORDERS
-- =============================================================================
-- Substitui as políticas ABERTAS de orders e order_items por políticas seguras.

-- 1. Garantir que RLS esteja ativado
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as políticas perigosas antigas (USING true / WITH CHECK true)
DROP POLICY IF EXISTS "Permitir leitura de orders por store_id ou buyer_email" ON public.orders;
DROP POLICY IF EXISTS "Permitir insercao publica de orders via API" ON public.orders;
DROP POLICY IF EXISTS "Permitir atualizacao de orders via API" ON public.orders;
DROP POLICY IF EXISTS "Permitir operacoes em order_items" ON public.order_items;

-- 3. Novas Políticas Seguras para ORDERS
-- SELECT: Criador pode ver se a order pertence à sua loja. Aluno pode ver se o email da order bate com seu email de login.
CREATE POLICY "Leitura segura de orders por criador ou comprador"
  ON public.orders FOR SELECT
  USING (
    -- É o Criador dono da loja do pedido
    store_id IN (SELECT id FROM public.stores WHERE creator_id = auth.uid())
    OR 
    -- É o Aluno dono do pedido (match por e-mail validado no JWT)
    LOWER(buyer_email) = LOWER(auth.jwt() ->> 'email')
  );

-- INSERT: Restringir acesso público. Apenas o servidor (Service Role) pode inserir pedidos novos (via API /checkout).
CREATE POLICY "Restringir insert de orders ao servidor"
  ON public.orders FOR INSERT
  WITH CHECK (false); -- false = Apenas Service Role Key pode fazer bypass.

-- UPDATE: Restringir acesso público. Apenas o servidor (Service Role) atualiza status de pedidos após webhooks Asaas.
CREATE POLICY "Restringir update de orders ao servidor"
  ON public.orders FOR UPDATE
  USING (false);

-- DELETE: Ninguém deleta pedidos (imutabilidade contábil).
CREATE POLICY "Restringir delete de orders ao servidor"
  ON public.orders FOR DELETE
  USING (false);

-- 4. Novas Políticas Seguras para ORDER_ITEMS
-- SELECT: Baseado na visibilidade do pedido pai.
CREATE POLICY "Leitura segura de order_items"
  ON public.order_items FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM public.orders WHERE 
        store_id IN (SELECT id FROM public.stores WHERE creator_id = auth.uid())
        OR LOWER(buyer_email) = LOWER(auth.jwt() ->> 'email')
    )
  );

-- INSERT/UPDATE/DELETE restritos ao servidor
CREATE POLICY "Restringir operacoes de escrita em order_items ao servidor"
  ON public.order_items FOR INSERT WITH CHECK (false);

CREATE POLICY "Restringir update em order_items ao servidor"
  ON public.order_items FOR UPDATE USING (false);

CREATE POLICY "Restringir delete em order_items ao servidor"
  ON public.order_items FOR DELETE USING (false);
