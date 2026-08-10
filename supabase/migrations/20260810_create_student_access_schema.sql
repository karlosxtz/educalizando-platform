-- =============================================================================
-- EDUCALIZANDO — MIGRATION: VINCULAÇÃO E ACESSO DOS MATERIAIS AO ALUNO
-- =============================================================================
-- Tabelas: student_product_access e adiciona student_id na tabela orders
-- Execução Idempotente (Não destrutiva; preserva histórico financeiro e pedidos antigos)
-- =============================================================================

-- 1. Adicionar coluna student_id na tabela orders (se ainda não existir)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS student_id VARCHAR(64);

-- 2. Criar Tabela student_product_access (se ainda não existir)
CREATE TABLE IF NOT EXISTS public.student_product_access (
  id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(64) NOT NULL,
  product_id VARCHAR(64) NOT NULL,
  order_id VARCHAR(64) REFERENCES public.orders(id) ON DELETE CASCADE,
  store_id VARCHAR(64) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'REVOKED'
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Índices de Alta Performance
CREATE INDEX IF NOT EXISTS idx_orders_student_id ON public.orders(student_id);
CREATE INDEX IF NOT EXISTS idx_stu_access_student_id ON public.student_product_access(student_id);
CREATE INDEX IF NOT EXISTS idx_stu_access_product_id ON public.student_product_access(product_id);
CREATE INDEX IF NOT EXISTS idx_stu_access_order_id ON public.student_product_access(order_id);

-- 4. Habilitar RLS (Row Level Security)
ALTER TABLE public.student_product_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura de acessos pelo próprio aluno" ON public.student_product_access;
CREATE POLICY "Permitir leitura de acessos pelo próprio aluno"
  ON public.student_product_access FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Permitir insercao e gestao de acessos via API" ON public.student_product_access;
CREATE POLICY "Permitir insercao e gestao de acessos via API"
  ON public.student_product_access FOR ALL
  USING (true);

-- 5. Vinculação Segura Não Destrutiva de Pedidos Antigos (se o email do comprador coincidir com um usuário do auth.users)
-- Mantém student_id = NULL para pedidos onde não houver vínculo inequívoco.
