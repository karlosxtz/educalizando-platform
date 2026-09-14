-- Solicitações e cancelamentos de afiliação passam pela API, que valida loja,
-- produto, identidade e status. O navegador mantém apenas leitura dos próprios registros.
DROP POLICY IF EXISTS "Users can insert own affiliate application" ON public.affiliates;
DROP POLICY IF EXISTS "Afiliado pode reenviar solicitação cancelada ou rejeitada" ON public.affiliates;
DROP POLICY IF EXISTS "Afiliado pode atualizar sua própria afiliação para cancelar" ON public.affiliates;
DROP POLICY IF EXISTS "Afiliado pode cancelar sua própria afiliação" ON public.affiliates;

-- Pedidos e acessos só podem ser escritos pelas APIs. Compradores e criadores
-- continuam lendo apenas os registros que realmente lhes pertencem.
DROP POLICY IF EXISTS "Permitir leitura de orders por store_id ou buyer_email" ON public.orders;
DROP POLICY IF EXISTS "Permitir insercao publica de orders via API" ON public.orders;
DROP POLICY IF EXISTS "Permitir atualizacao de orders via API" ON public.orders;
DROP POLICY IF EXISTS "orders_select_owner" ON public.orders;
CREATE POLICY "orders_select_owner" ON public.orders
  FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id::text = orders.store_id::text
        AND stores.creator_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Permitir operacoes em order_items" ON public.order_items;
DROP POLICY IF EXISTS "order_items_select_owner" ON public.order_items;
CREATE POLICY "order_items_select_owner" ON public.order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND (
          orders.student_id = auth.uid()::text
          OR EXISTS (
            SELECT 1 FROM public.stores
            WHERE stores.id::text = orders.store_id::text
              AND stores.creator_id = auth.uid()
          )
        )
    )
  );

DROP POLICY IF EXISTS "Permitir leitura de acessos pelo próprio aluno" ON public.student_product_access;
DROP POLICY IF EXISTS "Permitir insercao e gestao de acessos via API" ON public.student_product_access;
DROP POLICY IF EXISTS "student_product_access_select_owner" ON public.student_product_access;
CREATE POLICY "student_product_access_select_owner" ON public.student_product_access
  FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()::text
    OR EXISTS (
      SELECT 1
      FROM public.products
      JOIN public.stores ON stores.id = products.store_id
      WHERE products.id::text = student_product_access.product_id::text
        AND stores.creator_id = auth.uid()
    )
  );

-- Dados bancários e solicitações de saque nunca podem ser enumerados ou
-- alterados diretamente pelo navegador.
DROP POLICY IF EXISTS "Permitir leitura de creator_pix_keys por store_id" ON public.creator_pix_keys;
DROP POLICY IF EXISTS "Permitir insercao de creator_pix_keys via API" ON public.creator_pix_keys;
DROP POLICY IF EXISTS "Permitir atualizacao de creator_pix_keys via API" ON public.creator_pix_keys;
DROP POLICY IF EXISTS "creator_pix_keys_select_owner" ON public.creator_pix_keys;
CREATE POLICY "creator_pix_keys_select_owner" ON public.creator_pix_keys
  FOR SELECT TO authenticated
  USING (
    creator_id = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id::text = creator_pix_keys.store_id::text
        AND stores.creator_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Permitir leitura de withdrawals por store_id" ON public.withdrawals;
DROP POLICY IF EXISTS "Permitir insercao de withdrawals via API" ON public.withdrawals;
DROP POLICY IF EXISTS "Permitir atualizacao de withdrawals via API" ON public.withdrawals;
DROP POLICY IF EXISTS "withdrawals_select_owner" ON public.withdrawals;
CREATE POLICY "withdrawals_select_owner" ON public.withdrawals
  FOR SELECT TO authenticated
  USING (
    creator_id = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id::text = withdrawals.store_id::text
        AND stores.creator_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Permitir leitura de webhook events" ON public.asaas_transfer_webhook_events;

-- Avaliações são gravadas pela Server Action somente depois de validar a compra.
DROP POLICY IF EXISTS "Alunos podem inserir suas próprias avaliações" ON public.reviews;
DROP POLICY IF EXISTS "Alunos podem atualizar suas próprias avaliações" ON public.reviews;
DROP POLICY IF EXISTS "Alunos podem publicar avaliações" ON public.product_reviews;
DROP POLICY IF EXISTS "Criadores podem gerenciar avaliações dos seus materiais" ON public.product_reviews;

-- A administração de banners ocorre pelas rotas protegidas de superadministrador.
-- Usuários autenticados comuns não podem alterar banners nem seus arquivos.
DROP POLICY IF EXISTS "Admins podem gerenciar banners" ON public.main_banners;
DROP POLICY IF EXISTS "Usuários logados podem subir banners" ON storage.objects;
DROP POLICY IF EXISTS "Usuários logados podem modificar seus uploads de banners" ON storage.objects;
DROP POLICY IF EXISTS "Usuários logados podem deletar imagens de banners" ON storage.objects;

-- Troca de chave PIX atômica: se a nova chave falhar, a anterior permanece ativa.
CREATE OR REPLACE FUNCTION public.register_creator_pix_key_safe(
  p_id VARCHAR,
  p_creator_id VARCHAR,
  p_store_id VARCHAR,
  p_pix_key VARCHAR,
  p_pix_key_masked VARCHAR,
  p_holder_name TEXT,
  p_holder_cpf VARCHAR,
  p_validated_at TIMESTAMPTZ
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.creator_pix_keys
  SET is_active = FALSE, updated_at = NOW()
  WHERE store_id = p_store_id AND creator_id = p_creator_id AND is_active = TRUE;

  INSERT INTO public.creator_pix_keys (
    id, creator_id, store_id, pix_key_type, pix_key, pix_key_masked,
    holder_name, holder_cpf, validation_status, validated_at,
    is_active, created_at, updated_at
  ) VALUES (
    p_id, p_creator_id, p_store_id, 'CPF', p_pix_key, p_pix_key_masked,
    p_holder_name, p_holder_cpf, 'VALID', p_validated_at,
    TRUE, p_validated_at, p_validated_at
  );
  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.register_creator_pix_key_safe(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, TEXT, VARCHAR, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_creator_pix_key_safe(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, TEXT, VARCHAR, TIMESTAMPTZ) TO service_role;

-- Webhook e página de sucesso podem confirmar o mesmo pagamento ao mesmo tempo.
-- Mantemos uma única notificação de venda por criador/pedido no próprio banco.
DELETE FROM public.notifications AS duplicate
USING public.notifications AS keeper
WHERE duplicate.type = 'SALE_CONFIRMED'
  AND keeper.type = 'SALE_CONFIRMED'
  AND duplicate.creator_id = keeper.creator_id
  AND duplicate.metadata->>'orderId' = keeper.metadata->>'orderId'
  AND duplicate.id > keeper.id;

CREATE UNIQUE INDEX IF NOT EXISTS uq_sale_notification_creator_order
  ON public.notifications (creator_id, type, (metadata->>'orderId'))
  WHERE type = 'SALE_CONFIRMED' AND metadata->>'orderId' IS NOT NULL;
