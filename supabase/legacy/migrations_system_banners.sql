-- Create system_banners table
CREATE TABLE IF NOT EXISTS public.system_banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success')),
  is_active BOOLEAN DEFAULT true,
  link_url TEXT,
  link_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.system_banners ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view active banners
CREATE POLICY "Allow authenticated users to view active banners" ON public.system_banners
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Allow superadmin to manage banners
CREATE POLICY "Allow superadmins full access to system_banners" ON public.system_banners
  FOR ALL TO authenticated
  USING (
    (auth.jwt() ->> 'email') = current_setting('app.settings.superadmin_email', true)
    OR (auth.jwt() ->> 'email') = 'rafinhaagathathamy@gmail.com'
  );

-- Trigger to update 'updated_at' automatically
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_system_banners_updated_at
BEFORE UPDATE ON public.system_banners
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
