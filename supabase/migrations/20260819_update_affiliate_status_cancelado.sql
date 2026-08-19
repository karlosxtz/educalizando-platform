-- Altera a restrição de status para incluir 'cancelado'
ALTER TABLE public.affiliates DROP CONSTRAINT IF EXISTS affiliates_status_check;
ALTER TABLE public.affiliates ADD CONSTRAINT affiliates_status_check CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'cancelado'));

-- Adiciona política de UPDATE para permitir que o afiliado cancele sua própria afiliação
CREATE POLICY "Afiliado pode atualizar sua própria afiliação para cancelar" 
  ON affiliates FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND status = 'cancelado');
