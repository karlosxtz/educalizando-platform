-- =============================================================================
-- EDUCA LIZANDO — MIGRATION SQL: MÓDULO DE AVALIAÇÕES DE PRODUTO
-- =============================================================================

-- 1. Criação da tabela de Avaliações (reviews)
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  nota INT NOT NULL CHECK (nota >= 1 AND nota <= 5),
  comentario TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_student_product_review UNIQUE (product_id, student_id)
);

-- Indexes para performance
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_store_id ON public.reviews(store_id);
CREATE INDEX IF NOT EXISTS idx_reviews_student_id ON public.reviews(student_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_reviews_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_reviews_updated_at ON public.reviews;
CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_reviews_updated_at_column();

-- 2. Habilitar RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 3. Políticas RLS
-- Leitura livre para qualquer pessoa (vitrine, página do produto)
CREATE POLICY "Leitura pública de avaliações"
  ON public.reviews
  FOR SELECT
  USING (true);

-- Inserção permitida apenas para o aluno dono da avaliação
-- (A validação profunda de compra ocorrerá via Server Action ou API)
CREATE POLICY "Alunos podem inserir suas próprias avaliações"
  ON public.reviews
  FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Atualização permitida apenas para o aluno dono da avaliação
CREATE POLICY "Alunos podem atualizar suas próprias avaliações"
  ON public.reviews
  FOR UPDATE
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

-- Criadores podem visualizar todas as avaliações da sua loja (coberta pelo SELECT público acima, 
-- mas se fôssemos restringir por loja, seria aqui. Como o SELECT é público, isso basta).

-- Obs: Opcional: Permitir DELETE pelo dono. Atualmente omitido conforme especificado.
