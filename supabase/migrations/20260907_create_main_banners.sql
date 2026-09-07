-- Create main_banners table
CREATE TABLE IF NOT EXISTS public.main_banners (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT,
    image_desktop_url TEXT NOT NULL,
    image_mobile_url TEXT,
    link_url TEXT,
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.main_banners ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança da tabela
-- Qualquer um pode ler banners (para exibir na Home)
CREATE POLICY "Banners são visíveis publicamente"
    ON public.main_banners FOR SELECT
    USING (true);

-- Apenas admins podem modificar
CREATE POLICY "Admins podem gerenciar banners"
    ON public.main_banners FOR ALL
    USING (auth.role() = 'authenticated');

-- Inserir bucket no Storage (se não existir)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('main-banners', 'main-banners', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas do bucket
-- Leitura pública das imagens
CREATE POLICY "Imagens de banners são públicas"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'main-banners');

-- Inserção restrita a usuários logados
CREATE POLICY "Usuários logados podem subir banners"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'main-banners' AND
        auth.role() = 'authenticated'
    );

-- Atualização e deleção restrita a usuários logados
CREATE POLICY "Usuários logados podem modificar seus uploads de banners"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'main-banners' AND auth.role() = 'authenticated');

CREATE POLICY "Usuários logados podem deletar imagens de banners"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'main-banners' AND auth.role() = 'authenticated');
