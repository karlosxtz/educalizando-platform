-- =============================================================================
-- MIGRATION: Permitir que o afiliado reative sua própria afiliação
-- =============================================================================
-- Esta política permite que o usuário (afiliado) atualize a sua própria 
-- afiliação caso o status atual seja 'cancelado' ou 'rejeitado', sendo
-- obrigado a alterar o status resultante para 'pendente'.

CREATE POLICY "Afiliado pode reenviar solicitação cancelada ou rejeitada"
  ON affiliates FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('cancelado', 'rejeitado'))
  WITH CHECK (auth.uid() = user_id AND status = 'pendente');
