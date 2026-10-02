-- Tabela para gerenciar os vídeos tutoriais "Aprenda a Usar"
CREATE TABLE IF NOT EXISTS public.platform_tutorials (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  youtube_id text NOT NULL,
  duration text,
  "order" integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Políticas de RLS
ALTER TABLE public.platform_tutorials ENABLE ROW LEVEL SECURITY;

-- Policy de Leitura: Qualquer usuário (anônimo ou logado) pode ler os tutoriais ativos
CREATE POLICY "Tutoriais são publicamente visíveis" ON public.platform_tutorials
  FOR SELECT USING (true);

-- As operações de INSERT, UPDATE e DELETE serão feitas via API utilizando a service_role key,
-- então não precisamos criar policies de escrita explícitas para usuários normais, pois
-- service_role ignora RLS.

-- Inserindo os dados mockados como iniciais
INSERT INTO public.platform_tutorials (title, description, youtube_id, duration, "order", is_active)
VALUES 
  ('Como Cadastrar seu Primeiro Produto', 'Aprenda o passo a passo para cadastrar um material em PDF ou e-book e deixá-lo pronto para venda imediata.', 'dQw4w9WgXcQ', '05:20', 1, true),
  ('Como Criar Kits (Combos) Lucrativos', 'Descubra como agrupar seus materiais em combos para aumentar o ticket médio da sua loja.', 'dQw4w9WgXcQ', '03:45', 2, true),
  ('Configurando sua Vitrine e Chave PIX', 'Entenda como personalizar o visual da sua loja e garantir que os pagamentos caiam direto na sua conta.', 'dQw4w9WgXcQ', '04:10', 3, true)
ON CONFLICT DO NOTHING;
