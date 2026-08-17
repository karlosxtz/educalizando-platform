-- Add affiliate fields to stores
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS affiliate_program_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS affiliate_commission_type TEXT DEFAULT 'percentual' CHECK (affiliate_commission_type IN ('percentual', 'fixo'));
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS affiliate_commission_rate NUMERIC(5, 2) DEFAULT 0.00;

-- Create affiliates table
CREATE TABLE IF NOT EXISTS public.affiliates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
    commission_type TEXT CHECK (commission_type IN ('percentual', 'fixo')),
    commission_rate NUMERIC(5, 2), -- Specific override for this affiliate
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(store_id, user_id)
);

-- Add affiliate tracking to orders and purchases
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE SET NULL;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS affiliate_commission_amount NUMERIC(10, 2);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS affiliate_commission_amount NUMERIC(10, 2);

-- Add RLS Policies for Affiliates
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

-- Affiliates can read their own records
CREATE POLICY "Affiliates can read own records" 
    ON public.affiliates FOR SELECT 
    USING (auth.uid() = user_id);

-- Store owners can read and update affiliates for their stores
CREATE POLICY "Store owners can manage their affiliates" 
    ON public.affiliates FOR ALL 
    USING (
        store_id IN (
            SELECT id FROM public.stores WHERE creator_id = auth.uid()
        )
    );

-- Users can insert their own application
CREATE POLICY "Users can insert own affiliate application" 
    ON public.affiliates FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
