# Importação por token da Saber Didático

## Estado de validação

Implementação da Educalizando preparada com testes simulados de contrato, gravação, imagens e isolamento. O usuário confirmou posteriormente que o teste autenticado no painel retornou a loja e a prévia dos produtos. Isso valida a conexão inicial relatada pelo usuário, mas não prova a conclusão de uma importação inteira. A consulta sem credencial ao endereço exibido pelo usuário respondeu `401 {"error":"unauthorized"}`. Não foi encontrada documentação pública do contrato.

### Correção de instalação

Após a prévia válida, o início falhou com a mensagem genérica de migration. A inspeção de esquema por consulta sem acesso a linhas confirmou `42703` apenas para `seen_ids`; as demais colunas consultadas retornaram a recusa de leitura esperada `42501`. A função de imagens existia e também recusava acesso público. Foi adicionada a migration idempotente `20261019060000_repair_platform_import_seen_ids.sql`. O usuário confirmou sua execução e nova verificação confirmou a presença da coluna, mantendo a proteção de acesso. Nenhum produto foi criado ou alterado pelo agente nessa verificação.

A mensagem genérica foi substituída por diagnóstico por código: coluna ausente, tabela ausente, permissão/configuração do servidor ou indisponibilidade. Detalhes e valores do erro SQL nunca são expostos. Falha de permissão na listagem passa a responder indisponibilidade, em vez de afirmar que as tabelas não foram ativadas. A criação do processo ganhou teste de regressão para coluna ausente e erro de conexão.

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
- Revisão visual interativa indisponível: navegador desativado nas configurações do Work. Após executar a correção da coluna `seen_ids`, o usuário confirmou que a importação iniciou e está avançando. A conclusão de um catálogo real ainda não foi confirmada.

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
| `supabase/migrations/20261019060000_repair_platform_import_seen_ids.sql` | Completar instalações sem a coluna de detecção de repetição. |
| `src/lib/saber-import-errors.ts` | Diferenciar falhas de esquema, permissão e indisponibilidade sem expor detalhes SQL. |

## Correção da paginação: cinco recebidos de 281 informados

A captura enviada pelo usuário mostra cinco produtos recebidos e importados, total da API de 281 e pausa por divergência de total. O JSON bruto autenticado dessa exportação não estava disponível nesta sessão; a validação da correção contra essa loja real ainda depende da retomada pelo criador.

O adaptador anterior reconhecia somente alguns nomes de metadados de paginação. Agora aceita `currentPage`, `totalPages`, `perPage`, `nextPage`, `nextCursor`, totais no objeto `data` e paginação por offset. Quando a API fornece apenas lista parcial e total, tenta continuação por página numerada com tamanho explícito. Se a origem ignorar a paginação e repetir produtos, a importação continua sendo pausada; o total não é reduzido e a proteção não é removida.

Uma importação antiga que esgotou a fila e não armazenou continuação pode recuperar a próxima URL ao reler a última página confirmada. A identidade da loja, o total e a lista ordenada de IDs devem corresponder. Os produtos concluídos, recibos, contadores e IDs não são reiniciados nem sobrescritos. O criador usa **Continuar importação** com a mesma chave, sem cancelar ou iniciar outro trabalho.

A leitura de preços passa a reconhecer aliases explícitos de centavos (`price_cents`, `priceCents`, `priceInCents`, entre outros) e preços decimais em camelCase. A unidade não é inferida pela magnitude do valor. Ausência ou formato inválido continua exigindo revisão. Preços e avisos dos cinco produtos já concluídos não são alterados retroativamente; devem ser conferidos antes de publicar.

Regressões locais: catálogo sintético com 281 IDs distintos em 57 páginas de cinco itens (última com um), camelCase, offset, cursor, centavos, proteção contra cursor sem continuação, recuperação de trabalho antigo e recusa de troca de loja. Isso não é uma confirmação de 281 produtos realmente transferidos.

Arquivos desta correção: `src/lib/saber-export-contract.ts` (paginação e preços), `src/lib/saber-import-job.ts` (recuperação preservando progresso), `scripts/verify-saber-import.cjs` e `scripts/verify-saber-job.cjs` (regressões), e este relatório. Sem migration, alteração de RLS, checkout ou webhooks.

## Ampliação do preenchimento e recuperação de preços pendentes

A pedido do usuário, o adaptador passa a reconhecer mais aliases de campos do produto e preços agrupados em `pricing`/`precos`, em reais ou com unidade explícita de centavos. Valores de moeda estrangeira e objetos `amount` sem unidade reconhecida permanecem pendentes, sem conversão presumida. O formato exato de preço da exportação real da loja relatada ainda precisa ser confirmado na prévia autenticada.

Agora são reconhecidos também nomes camelCase de capa, galeria, descrição, título, nível, vídeo, vídeo como capa, quantidade de páginas, faixa etária, formato, cor e tipo, além de temas sazonais. Somente dados compatíveis com o cadastro são gravados. Não são copiados clientes, avaliações, vendas, credenciais, arquivos privados pagos, propriedade de outra loja ou regras comerciais da plataforma de origem. As capacidades da Educalizando (por exemplo, até cinco categorias e trinta tags) continuam valendo.

Esta ampliação substitui a limitação anterior sobre preços já concluídos: ao atualizar uma fila antiga com os mesmos IDs na mesma ordem e a mesma loja/total, o importador pode preencher os preços ainda ausentes dos itens concluídos dessa página. Exige recibo da mesma origem, ID determinístico, loja de destino correta, rascunho, `import_incomplete=true`, preço zero, `import_price_confirmed=false`, `is_free=false` e preço original nulo. Assim não altera um preço manual, um preço confirmado, um produto gratuito definido pelo criador ou um produto publicado. Recibos e contadores não são reiniciados. Uma nova passagem pelo catálogo também pode preencher esses mesmos placeholders, sem duplicar produtos.

A prévia inclui uma seção de informações dos campos e, quando algum preço não for reconhecido, mostra apenas nomes e tipos de campos de preço enviados pela origem, com botão de copiar para suporte. Não inclui valores brutos, tokens ou dados pessoais. Isso permite confirmar um formato não documentado sem pedir a chave no chat.

| Arquivo desta ampliação | Motivo |
| --- | --- |
| `src/lib/saber-product-price.ts` | Preços com unidade explícita, aliases, moedas e diagnóstico sem valores. |
| `src/lib/saber-export-contract.ts` | Normalização ampliada de metadados e versão do adaptador na fila JSON existente. |
| `src/lib/saber-import-job.ts` | Atualização de fila antiga e preenchimento condicional de preços pendentes. |
| `src/app/api/creator/platform-import/route.ts` | Campos de diagnóstico sanitizados na prévia privada. |
| `src/app/dashboard/importar-plataforma/page.tsx` | Orientação sobre os campos importados e cópia segura do diagnóstico. |
| `scripts/verify-saber-import.cjs` | Casos de preço agrupado, moeda/unidade ambígua, metadados e privacidade. |
| `scripts/verify-saber-job.cjs` | Recuperação de preço, preservação de edições e de produtos confirmados/publicados. |
| Este relatório | Comportamento, escopo e limitações verificadas. |

Sem nova migration e sem alteração de RLS, checkout, Asaas, webhooks ou regras de publicação. Os testes são locais; ainda não representam confirmação de todos os valores da loja real.
