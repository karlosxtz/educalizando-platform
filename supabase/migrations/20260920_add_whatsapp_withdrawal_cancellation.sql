-- Cancelamento de segurança solicitado pelo WhatsApp cadastrado na loja.
-- O saldo reservado é devolvido na mesma transação que marca o saque cancelado.
ALTER TABLE public.withdrawals
  ADD COLUMN IF NOT EXISTS cancellation_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancellation_requested_via TEXT;

CREATE OR REPLACE FUNCTION public.cancel_withdrawal_by_whatsapp(
  p_withdrawal_id TEXT,
  p_phone_e164 TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_withdrawal public.withdrawals%ROWTYPE;
BEGIN
  SELECT * INTO v_withdrawal
  FROM public.withdrawals
  WHERE id = p_withdrawal_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Solicitação não encontrada.');
  END IF;

  IF v_withdrawal.status NOT IN ('PENDING', 'PROCESSING') THEN
    RETURN json_build_object('success', false, 'error', 'Esta solicitação não pode mais ser cancelada.');
  END IF;

  UPDATE public.withdrawals
  SET status = 'CANCELLED',
      cancelled_at = NOW(),
      cancellation_requested_at = NOW(),
      cancellation_requested_via = 'WHATSAPP:' || p_phone_e164,
      failure_reason = 'Cancelamento solicitado pelo WhatsApp cadastrado.',
      updated_at = NOW()
  WHERE id = p_withdrawal_id;

  INSERT INTO public.wallet_transactions (
    id, creator_id, store_id, type, status, gross_amount, net_amount, description, created_at
  ) VALUES (
    gen_random_uuid()::text,
    v_withdrawal.creator_id,
    v_withdrawal.store_id,
    'ADJUSTMENT',
    'COMPLETED',
    v_withdrawal.amount,
    v_withdrawal.amount,
    'Devolução de saldo do saque cancelado via WhatsApp #' || p_withdrawal_id,
    NOW()
  );

  RETURN json_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_withdrawal_by_whatsapp(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_withdrawal_by_whatsapp(TEXT, TEXT) TO service_role;
