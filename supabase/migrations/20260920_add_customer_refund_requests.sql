-- Solicitações de reembolso feitas exclusivamente pelo comprador.
CREATE TABLE IF NOT EXISTS public.order_refund_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR(64) NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  requester_id UUID NOT NULL,
  requester_email TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (char_length(btrim(reason)) BETWEEN 10 AND 1000),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
  review_note TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_order_refund_requests_order
  ON public.order_refund_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_order_refund_requests_status_created
  ON public.order_refund_requests(status, created_at DESC);

ALTER TABLE public.order_refund_requests ENABLE ROW LEVEL SECURITY;
-- Nenhuma policy de cliente: a rota server-side valida o dono do pedido e
-- impede acesso ou alteração de solicitações de outras contas.
