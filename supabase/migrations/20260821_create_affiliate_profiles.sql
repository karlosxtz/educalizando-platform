CREATE TABLE IF NOT EXISTS public.affiliate_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    slug VARCHAR(100) NOT NULL,
    nome VARCHAR(100),
    descricao TEXT,
    logo_url TEXT,
    banner_url TEXT,
    cor_primaria VARCHAR(20) DEFAULT '#2563eb',
    tema VARCHAR(50) DEFAULT 'default',
    whatsapp VARCHAR(20),
    instagram VARCHAR(50),
    tiktok VARCHAR(50),
    facebook VARCHAR(100),
    youtube VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id),
    UNIQUE(slug)
);

-- Enable RLS
ALTER TABLE public.affiliate_profiles ENABLE ROW LEVEL SECURITY;

-- Everyone can read
CREATE POLICY "Public can read affiliate profiles" 
    ON public.affiliate_profiles FOR SELECT 
    USING (true);

-- User can insert their own profile
CREATE POLICY "Users can insert own affiliate profile" 
    ON public.affiliate_profiles FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- User can update their own profile
CREATE POLICY "Users can update own affiliate profile" 
    ON public.affiliate_profiles FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
