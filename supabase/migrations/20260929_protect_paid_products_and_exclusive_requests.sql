-- Preserva produtos já adquiridos e impede o cancelamento de encomendas pagas.
-- As validações na API continuam oferecendo mensagens amigáveis; estes gatilhos
-- fecham a janela de concorrência e protegem os dados contra escritas diretas.

CREATE OR REPLACE FUNCTION public.prevent_purchased_product_removal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  product_key text := OLD.id::text;
  is_removal boolean;
BEGIN
  IF TG_OP = 'DELETE' THEN
    is_removal := true;
  ELSE
    is_removal := (NEW.excluido_em IS NOT NULL AND OLD.excluido_em IS NULL)
      OR (NEW.status = 'excluido' AND OLD.status IS DISTINCT FROM 'excluido');
  END IF;

  IF NOT is_removal THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.order_items item
    JOIN public.orders purchase ON purchase.id::text = item.order_id::text
    WHERE item.product_id::text = product_key
      AND (purchase.status IN ('paid', 'refunded') OR purchase.paid_at IS NOT NULL)
  ) OR EXISTS (
    SELECT 1
    FROM public.student_product_access access
    WHERE access.product_id::text = product_key
      AND access.status = 'ACTIVE'
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '23503',
      MESSAGE = 'Produto com compra confirmada ou acesso concedido não pode ser excluído.';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_purchased_product_removal ON public.products;
CREATE TRIGGER protect_purchased_product_removal
BEFORE DELETE OR UPDATE OF excluido_em, status ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.prevent_purchased_product_removal();

CREATE OR REPLACE FUNCTION public.prevent_paid_exclusive_request_cancellation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('cancelled', 'rejected')
    AND OLD.status IS DISTINCT FROM NEW.status
    AND (
      OLD.status IN ('paid', 'in_production', 'delivered')
      OR EXISTS (
        SELECT 1
        FROM public.exclusive_material_payments payment
        WHERE payment.request_id = OLD.id
          AND payment.status = 'paid'
      )
    )
  THEN
    RAISE EXCEPTION USING
      ERRCODE = '23503',
      MESSAGE = 'Solicitação exclusiva paga não pode ser cancelada.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_paid_exclusive_request_cancellation ON public.exclusive_material_requests;
CREATE TRIGGER protect_paid_exclusive_request_cancellation
BEFORE UPDATE OF status ON public.exclusive_material_requests
FOR EACH ROW
EXECUTE FUNCTION public.prevent_paid_exclusive_request_cancellation();

CREATE OR REPLACE FUNCTION public.prevent_paid_exclusive_proposal_cancellation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('superseded', 'declined')
    AND OLD.status = 'accepted'
    AND EXISTS (
      SELECT 1
      FROM public.exclusive_material_payments payment
      WHERE payment.request_id = OLD.request_id
        AND payment.status = 'paid'
    )
  THEN
    RAISE EXCEPTION USING
      ERRCODE = '23503',
      MESSAGE = 'Proposta de solicitação exclusiva paga não pode ser cancelada.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_paid_exclusive_proposal_cancellation ON public.exclusive_material_proposals;
CREATE TRIGGER protect_paid_exclusive_proposal_cancellation
BEFORE UPDATE OF status ON public.exclusive_material_proposals
FOR EACH ROW
EXECUTE FUNCTION public.prevent_paid_exclusive_proposal_cancellation();
