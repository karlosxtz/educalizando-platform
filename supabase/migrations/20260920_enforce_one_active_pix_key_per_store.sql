-- Uma loja pode ter várias chaves históricas, mas apenas uma pode ficar ativa.
-- Isso também corrige cadastros antigos que deixaram mais de uma chave ativa.
WITH ranked_pix_keys AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY store_id
      ORDER BY COALESCE(updated_at, created_at) DESC, id DESC
    ) AS row_number
  FROM public.creator_pix_keys
  WHERE is_active = TRUE
)
UPDATE public.creator_pix_keys AS pix_key
SET is_active = FALSE, updated_at = NOW()
FROM ranked_pix_keys AS ranked
WHERE pix_key.id = ranked.id
  AND ranked.row_number > 1;

CREATE UNIQUE INDEX IF NOT EXISTS uq_creator_pix_keys_one_active_per_store
  ON public.creator_pix_keys(store_id)
  WHERE is_active = TRUE;

-- A validação de posse da loja acontece na API antes desta RPC. Aqui, ao trocar
-- a chave, todas as chaves ativas daquela mesma loja são desativadas.
CREATE OR REPLACE FUNCTION public.register_creator_pix_key_safe(
  p_id VARCHAR,
  p_creator_id VARCHAR,
  p_store_id VARCHAR,
  p_pix_key VARCHAR,
  p_pix_key_masked VARCHAR,
  p_holder_name TEXT,
  p_holder_cpf VARCHAR,
  p_validated_at TIMESTAMPTZ
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.creator_pix_keys
  SET is_active = FALSE, updated_at = NOW()
  WHERE store_id = p_store_id AND is_active = TRUE;

  INSERT INTO public.creator_pix_keys (
    id, creator_id, store_id, pix_key_type, pix_key, pix_key_masked,
    holder_name, holder_cpf, validation_status, validated_at,
    is_active, created_at, updated_at
  ) VALUES (
    p_id, p_creator_id, p_store_id, 'CPF', p_pix_key, p_pix_key_masked,
    p_holder_name, p_holder_cpf, 'VALID', p_validated_at,
    TRUE, p_validated_at, p_validated_at
  );

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.register_creator_pix_key_safe(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, TEXT, VARCHAR, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_creator_pix_key_safe(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, TEXT, VARCHAR, TIMESTAMPTZ) TO service_role;
