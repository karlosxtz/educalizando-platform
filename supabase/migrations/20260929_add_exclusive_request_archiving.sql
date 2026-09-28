ALTER TABLE public.exclusive_material_requests
  ADD COLUMN IF NOT EXISTS hidden_by_customer_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS hidden_by_creator_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_by UUID;

CREATE INDEX IF NOT EXISTS idx_exclusive_requests_customer_visible
  ON public.exclusive_material_requests(customer_id, updated_at DESC)
  WHERE hidden_by_customer_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_exclusive_requests_creator_visible
  ON public.exclusive_material_requests(creator_id, updated_at DESC)
  WHERE hidden_by_creator_at IS NULL;
