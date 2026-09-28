ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS exclusive_material_requests_enabled BOOLEAN NOT NULL DEFAULT FALSE;
