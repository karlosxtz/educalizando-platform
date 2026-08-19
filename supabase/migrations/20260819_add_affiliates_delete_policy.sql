-- Adiciona política de DELETE para permitir que o afiliado cancele sua própria afiliação

CREATE POLICY "Afiliado pode cancelar sua própria afiliação" 
  ON affiliates FOR DELETE 
  USING (auth.uid() = user_id);
