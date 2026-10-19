# Importação por token da Saber Didático

## Estado de validação

Implementação da Educalizando preparada com testes simulados de contrato, gravação, imagens e isolamento. **Não houve teste autenticado real na Saber Didático.** A consulta sem credencial ao endereço exibido pelo usuário respondeu `401 {"error":"unauthorized"}`. Não foi encontrada documentação pública do contrato. O uso de `Authorization: Bearer` e os formatos normalizados precisam ser confirmados com uma chave válida no painel. Não afirmar que a exportação completa de uma loja real já foi validada.

A chave exibida na imagem enviada pelo usuário não foi copiada, usada, armazenada nem inserida em commits. Recomendada revogação e geração de outra. Não foi alterado nenhum dado na plataforma de origem ou criado produto real para testes.

## Como usar

Painel → **Gerenciar loja → Importar de outra plataforma** (`/dashboard/importar-plataforma`). Copie a chave da exportação oficial da sua própria loja Saber Didático e cole no campo oculto. O endpoint é fixo no servidor: `https://saberdidatico.com.br/api/public/sync/seller-products`.

1. **Testar conexão e ver prévia**: consulta autorizada, mostrando loja, quantidade informada e amostra de produtos. Não cadastra produtos.
2. **Confirmar loja e importar catálogo**: relê a origem, confirma que corresponde à prévia e cria o processo da loja autenticada na Educalizando.
3. Mantenha a página aberta enquanto processa. As etapas são pequenas: cadastro, cada imagem, recibo e próxima página. É possível pausar, retomar ou cancelar. Fechar a página interrompe novas etapas sem perder as concluídas; para retomar, cole a mesma chave. Se trocar a chave, cancele o processo anterior e inicie outro; recibos por loja de origem evitam duplicações.
4. Os produtos entram em **rascunho**, com `import_incomplete=true`. Revise os dados, envie os arquivos finais de entrega e publique usando o cadastro normal. Quando o preço não vier reconhecido da origem, sua confirmação será exigida pela regra de revisão já existente.

## Escopo e limites

Campos suportados quando presentes em formato reconhecido: identificador, título, descrição em texto, preço, preço original, capa, galeria, imagens embutidas na descrição, categorias, nível de ensino, tags, link público YouTube/Instagram, quantidade de páginas, faixa etária, detalhes de formato e modo de cor. Categorias ausentes no destino podem ser criadas na própria loja; níveis são relacionados apenas quando reconhecidos no cadastro existente. Limites do modelo de destino (até cinco categorias/níveis e trinta tags) e imagens indisponíveis precisam de revisão. Imagens não são removidas silenciosamente: uma falha pausa a operação e o criador decide tentar de novo ou continuar sem a imagem.

Não importa clientes, pedidos, avaliações, números de vendas, comissões, configurações de checkout, licenças ou arquivos pagos de entrega. Não fabrica preços ausentes nem os publica como gratuidade: usa rascunho com revisão pendente. Não há promessa de importar campos que a API não exporta ou cujo formato ainda não esteja validado.

A paginação segue somente continuação explícita da API (link/cursor/metadados de páginas). Não há teto de 100 produtos no processo. Cada resposta tem limite de 20 MiB; respostas maiores precisam de paginação do fornecedor. Cada imagem aceita até 15 MiB e formatos JPEG, PNG, WebP, GIF e AVIF. Uma imagem bloqueada ou em formato diferente pausa a etapa. A fila não é um envio ilimitado em uma única requisição.

O número de produtos recebidos é conferido com o total informado pela API antes de concluir. URLs ou produtos repetidos entre páginas e mudança de loja interrompem a operação. Quando a origem não informa total nem continuação, a interface deixa explícito que o total geral não foi informado; deve-se comparar com a origem, sem alegar uma completude externa impossível de comprovar.

## Segurança e arquitetura

- Token somente na memória da página e em requisições POST autenticadas para a API da Educalizando. Nunca em URL, localStorage, banco ou mensagens de erro. No banco fica apenas SHA-256 para vincular a retomada à mesma chave.
- Credencial enviada somente ao endpoint HTTPS exato da Saber. Nenhum redirecionamento é seguido com a chave. Paginação não pode trocar host, rota, porta, usuário ou parâmetros de escopo de loja. A resposta não pode ecoar a chave.
- Loja destino vem da sessão autenticada e do banco. `store_id` do cliente é ignorado. Toda consulta/alteração de progresso é filtrada pela loja autenticada. Produtos da resposta precisam corresponder à identidade única da loja de origem.
- IDs determinísticos e recibos por loja destino + origem + produto garantem retomada sem duplicação. Produtos já recebidos e revisados não são sobrescritos. Nenhum produto é publicado automaticamente.
- Lease no banco permite apenas uma etapa por vez. Gravação de imagem usa função transacional que verifica lease, loja, estado de rascunho e revisão pendente, evitando alterar material já publicado.
- Imagens são copiadas para o MinIO existente por rotina compartilhada que valida HTTPS, rede privada, redirecionamentos, tipo e tamanho. A chave da exportação nunca é enviada a servidores de imagem. As imagens públicas continuam servidas diretamente do MinIO com cache longo. Nenhum R2/KV adicional, serviço pago de transformação, webhook ou tarefa agendada foi criado.
- O processamento usa chamadas sequenciais do painel enquanto aberto. Não há polling de fundo quando parado. As imagens atravessam o servidor somente na cópia inicial da importação, não para serem exibidas aos visitantes.

## Migrations

1. `20261019050000_create_platform_product_imports.sql`: tabelas novas de progresso e recibos, RLS ativada nessas tabelas e acesso direto restrito ao service_role. Não altera políticas existentes nem registros de produtos.
2. `20261019051000_platform_import_image_transaction.sql`: campo de identificadores recebidos para detectar repetição e função transacional restrita ao service_role. O usuário confirmou a execução de ambos os arquivos.

`products.import_source` não é rotulado falsamente como WooCommerce e sua constraint existente não foi alterada. A origem fica nas tabelas novas. O indicador já existente `import_incomplete` é usado para a revisão genérica de qualquer importação; as regras de preço/entrega/publicação permanecem as mesmas.

## Verificação

- `verify-saber-import.cjs`: destino do token, recusa de redirecionamento, normalização, valores, exclusão de arquivos/clientes, loja única, identificadores determinísticos, paginação e proteções SQL.
- `verify-saber-job.cjs`: criação de rascunho, cópia de imagem, recibo, conclusão, reimportação sem duplicar, preservação de produto revisado, colisão de loja, repetição de página e total divergente.
- `verify-saber-import-api.cjs`: autenticação, vínculo de destino pela sessão, prévia sem criação, recusa de outra origem HTTP, proteção contra acesso à importação de outra loja, respostas privadas e ausência do token nas respostas.
- Lint, typecheck, testes de uploads/entrega e os 16 testes da integração WooCommerce passaram. Build real Vinext/Wrangler executado antes da publicação.
- Revisão visual interativa indisponível: navegador desativado nas configurações do Work. Não há validação autenticada da API rival até o criador usar o botão de teste com uma chave válida.

## Arquivos alterados

| Arquivo | Motivo |
| --- | --- |
| `supabase/migrations/20261019050000_create_platform_product_imports.sql` | Progresso e recibos privados de importação. |
| `supabase/migrations/20261019051000_platform_import_image_transaction.sql` | Detecção de repetição e transação segura de imagem. |
| `src/lib/saber-export-contract.ts` | Normalização conservadora da exportação e verificação de loja/paginação. |
| `src/lib/saber-export-client.ts` | Transporte do token restrito ao endpoint oficial, resposta limitada e IDs estáveis. |
| `src/lib/saber-import-job.ts` | Etapas retomáveis de dados/imagens, recibos e proteção de cadastros existentes. |
| `src/lib/woocommerce-media.ts` | Nova função de imagem pública usando a validação/MinIO existentes; funções Woo preservadas. |
| `src/app/api/creator/platform-import/route.ts` | Consulta de prévia e gestão privada da importação pela sessão. |
| `src/app/dashboard/importar-plataforma/page.tsx` | Chave em memória, prévia, confirmação, progresso e retomada. |
| `src/components/dashboard/Sidebar.tsx` | Entrada do módulo em Gerenciar loja. |
| `src/app/dashboard/produtos/novo/page.tsx` | Mostrar a revisão de preço para qualquer cadastro com importação pendente. |
| `src/app/dashboard/produtos/page.tsx` | Aviso genérico de revisão/entrega pendente. |
| `scripts/verify-saber-import.cjs` | Testes de transporte/contrato e proteção da credencial. |
| `scripts/verify-saber-job.cjs` | Testes de gravação, retomada e preservação de produtos. |
| `scripts/verify-saber-import-api.cjs` | Testes de autorização e isolamento na API. |
| `ops/IMPORTACAO-SABER-TOKEN-2026-10-19.md` | Uso, limitações, evidências e inventário de alterações. |
