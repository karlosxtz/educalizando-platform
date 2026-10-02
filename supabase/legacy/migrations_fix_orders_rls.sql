-- =============================================================================
-- EDUCALIZANDO — MIGRATION FINAL DE RLS EM ORDERS & ORDER_ITEMS
-- =============================================================================
-- Resolve incompatibilidade de tipos: orders.store_id (VARCHAR) vs stores.id (UUID)
-- e stores.creator_id (UUID) vs auth.uid() (UUID).
-- =============================================================================

-- 1. Garantir que RLS esteja ativado
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as políticas antigas (evitar conflito)
DROP POLICY IF EXISTS "Permitir leitura de orders por store_id ou buyer_email" ON public.orders;
DROP POLICY IF EXISTS "Permitir insercao publica de orders via API" ON public.orders;
DROP POLICY IF EXISTS "Permitir atualizacao de orders via API" ON public.orders;
DROP POLICY IF EXISTS "Permitir operacoes em order_items" ON public.order_items;
DROP POLICY IF EXISTS "Leitura segura de orders por criador ou comprador" ON public.orders;
DROP POLICY IF EXISTS "Restringir insert de orders ao servidor" ON public.orders;
DROP POLICY IF EXISTS "Restringir update de orders ao servidor" ON public.orders;
DROP POLICY IF EXISTS "Restringir delete de orders ao servidor" ON public.orders;
DROP POLICY IF EXISTS "Leitura segura de order_items" ON public.order_items;
DROP POLICY IF EXISTS "Restringir operacoes de escrita em order_items ao servidor" ON public.order_items;
DROP POLICY IF EXISTS "Restringir update em order_items ao servidor" ON public.order_items;
DROP POLICY IF EXISTS "Restringir delete em order_items ao servidor" ON public.order_items;

-- 3. Novas Políticas Seguras para ORDERS
-- SELECT: Criador vê se a order pertence à sua loja. Aluno vê se o email bate.
-- Nota: orders.store_id é VARCHAR, stores.id é UUID — cast para text
CREATE POLICY "Leitura segura de orders por criador ou comprador"
  ON public.orders FOR SELECT
  USING (
    store_id IN (SELECT id::text FROM public.stores WHERE creator_id = auth.uid())
    OR 
    LOWER(buyer_email) = LOWER(auth.jwt() ->> 'email')
  );

-- INSERT/UPDATE/DELETE: Apenas Service Role Key (supabaseAdmin) pode operar
CREATE POLICY "Restringir insert de orders ao servidor"
  ON public.orders FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Restringir update de orders ao servidor"
  ON public.orders FOR UPDATE
  USING (false);

CREATE POLICY "Restringir delete de orders ao servidor"
  ON public.orders FOR DELETE
  USING (false);

-- 4. Novas Políticas Seguras para ORDER_ITEMS
CREATE POLICY "Leitura segura de order_items"
  ON public.order_items FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM public.orders WHERE 
        store_id IN (SELECT id::text FROM public.stores WHERE creator_id = auth.uid())
        OR LOWER(buyer_email) = LOWER(auth.jwt() ->> 'email')
    )
  );

CREATE POLICY "Restringir operacoes de escrita em order_items ao servidor"
  ON public.order_items FOR INSERT WITH CHECK (false);

CREATE POLICY "Restringir update em order_items ao servidor"
  ON public.order_items FOR UPDATE USING (false);

CREATE POLICY "Restringir delete em order_items ao servidor"
  ON public.order_items FOR DELETE USING (false);
