-- Solicitações e cancelamentos de afiliação passam pela API, que valida loja,
-- produto, identidade e status. O navegador mantém apenas leitura dos próprios registros.
DROP POLICY IF EXISTS "Users can insert own affiliate application" ON public.affiliates;
DROP POLICY IF EXISTS "Afiliado pode reenviar solicitação cancelada ou rejeitada" ON public.affiliates;
DROP POLICY IF EXISTS "Afiliado pode atualizar sua própria afiliação para cancelar" ON public.affiliates;
