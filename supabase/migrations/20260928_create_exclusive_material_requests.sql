-- Encomendas particulares entre clientes e criadores.
CREATE TABLE IF NOT EXISTS public.exclusive_material_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  title TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  genre TEXT,
  file_type TEXT,
  target_audience TEXT,
  deadline DATE,
  budget NUMERIC(10,2),
  description TEXT NOT NULL,
  reference_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','negotiating','awaiting_payment','paid','in_production','delivered','cancelled','rejected')),
  accepted_proposal_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.exclusive_material_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.exclusive_material_requests(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('customer','creator','system')),
  body TEXT NOT NULL,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exclusive_material_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.exclusive_material_requests(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  delivery_days INTEGER NOT NULL CHECK (delivery_days > 0),
  scope TEXT NOT NULL,
  revisions INTEGER NOT NULL DEFAULT 1 CHECK (revisions >= 0),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','accepted','declined','superseded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

ALTER TABLE public.exclusive_material_requests
  ADD CONSTRAINT exclusive_material_requests_accepted_proposal_fk
  FOREIGN KEY (accepted_proposal_id) REFERENCES public.exclusive_material_proposals(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.exclusive_material_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL UNIQUE REFERENCES public.exclusive_material_requests(id) ON DELETE CASCADE,
  proposal_id UUID NOT NULL REFERENCES public.exclusive_material_proposals(id),
  order_nsu TEXT NOT NULL UNIQUE,
  transaction_nsu TEXT,
  invoice_slug TEXT,
  checkout_url TEXT,
  gross_amount NUMERIC(10,2) NOT NULL,
  platform_fee_amount NUMERIC(10,2) NOT NULL,
  creator_net_amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.exclusive_material_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.exclusive_material_requests(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  content_type TEXT,
  file_size BIGINT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exclusive_material_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  request_id UUID NOT NULL REFERENCES public.exclusive_material_requests(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('message','proposal','payment','delivered')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exclusive_requests_creator ON public.exclusive_material_requests(creator_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_exclusive_requests_customer ON public.exclusive_material_requests(customer_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_exclusive_messages_request ON public.exclusive_material_messages(request_id, created_at);
CREATE INDEX IF NOT EXISTS idx_exclusive_notifications_customer ON public.exclusive_material_notifications(customer_id, read_at, created_at DESC);

ALTER TABLE public.exclusive_material_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exclusive_material_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exclusive_material_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exclusive_material_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exclusive_material_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exclusive_material_notifications ENABLE ROW LEVEL SECURITY;

-- Mutations and reads happen through authenticated server routes. These policies prevent
-- accidental access through the public client while preserving service-role operations.
REVOKE ALL ON public.exclusive_material_requests, public.exclusive_material_messages,
  public.exclusive_material_proposals, public.exclusive_material_payments,
  public.exclusive_material_deliveries, public.exclusive_material_notifications FROM anon, authenticated;
