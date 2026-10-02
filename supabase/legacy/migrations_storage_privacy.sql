-- Script de Correção de Privacidade: Storage 'product-files'
-- Resolve: Vazamento de arquivos e pirataria.

-- 1. Garante que o bucket NUNCA seja público
UPDATE storage.buckets
SET public = false
WHERE id = 'product-files';

-- 2. Remove políticas antigas que poderiam permitir leitura por qualquer usuário logado
DROP POLICY IF EXISTS "Criadores podem ler seus arquivos didáticos" ON storage.objects;

-- 3. Cria uma política restritiva onde SOMENTE o DONO do arquivo pode ler diretamente
CREATE POLICY "Criadores podem ler apenas seus proprios arquivos didaticos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'product-files' 
  AND auth.uid() = owner
);

-- NOTA: O backend (Next.js API Route) usa a Service Role Key, 
-- que ignora RLS. Portanto, a geração de Signed URLs para alunos 
-- (após validação de compra) continuará funcionando normalmente, 
-- mas ninguém conseguirá burlar o sistema pela URL direta.
