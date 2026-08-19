-- =======================================================================================
-- EDUCALIZANDO - MIGRATION: SECURITY FIX FOR AFFILIATE STATUS
-- Fechar brecha de autoaprovação via injeção direta de payload.
-- Todo novo INSERT na tabela affiliates deve obrigatoriamente nascer como 'pendente'.
-- O Criador aprovará posteriormente utilizando UPDATE (a Policy de UPDATE continua restrita ao dono).
-- =======================================================================================

CREATE OR REPLACE FUNCTION force_affiliate_status_pendente()
RETURNS TRIGGER AS $$
BEGIN
    NEW.status = 'pendente';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_force_affiliate_status_pendente ON public.affiliates;

-- Executado BEFORE INSERT para sobrepor a intenção suja do client
CREATE TRIGGER trigger_force_affiliate_status_pendente
BEFORE INSERT ON public.affiliates
FOR EACH ROW
EXECUTE FUNCTION force_affiliate_status_pendente();
