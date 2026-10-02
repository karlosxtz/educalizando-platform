-- Adiciona novas colunas na tabela stores para personalização avançada

ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS author_image_url TEXT,
ADD COLUMN IF NOT EXISTS author_bio TEXT,
ADD COLUMN IF NOT EXISTS youtube TEXT,
ADD COLUMN IF NOT EXISTS tiktok TEXT,
ADD COLUMN IF NOT EXISTS facebook TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS button_style TEXT DEFAULT 'rounded', -- 'rounded', 'pill', 'square'
ADD COLUMN IF NOT EXISTS welcome_message TEXT;
