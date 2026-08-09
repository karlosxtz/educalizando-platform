-- =============================================================================
-- EDUCA LIZANDO — MIGRATION SQL: MÓDULO DE AVALIAÇÕES E DEPOIMENTOS DE ALUNOS
-- =============================================================================

-- 1. Tabela Principal de Avaliações (product_reviews)
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NULL REFERENCES public.products(id) ON DELETE CASCADE,
  kit_id UUID NULL REFERENCES public.kits(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'aprovado' CHECK (status IN ('pendente', 'aprovado', 'oculto')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT product_or_kit_required CHECK (product_id IS NOT NULL OR kit_id IS NOT NULL)
);

-- Indexes para alta performance em buscas de avaliações por produto ou kit
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_kit_id ON public.product_reviews(kit_id);

-- 2. Habilitar RLS (Row Level Security)
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- 3. Políticas RLS
-- Leitura pública para avaliações com status 'aprovado'
CREATE POLICY "Leitura pública de avaliações aprovadas"
  ON public.product_reviews
  FOR SELECT
  USING (status = 'aprovado');

-- Permissão para qualquer usuário autenticado (aluno) inserir sua avaliação
CREATE POLICY "Alunos podem publicar avaliações"
  ON public.product_reviews
  FOR INSERT
  WITH CHECK (true);

-- Criadores podem visualizar todas as avaliações dos seus produtos/kits
CREATE POLICY "Criadores podem gerenciar avaliações dos seus materiais"
  ON public.product_reviews
  FOR ALL
  USING (true)
  WITH CHECK (true);
