# Correção da importação WooCommerce

## Diagnóstico no código

- POST antigo recusava seleções acima de 100 produtos.
- Catálogo buscava todas as páginas numa única requisição e mantinha todos os produtos na memória. O helper antigo também parava em 100 páginas (10.000 registros).
- Uma sincronização copiava todas as imagens e arquivos do lote antes de responder. Falhas eram contadas genericamente, sem identificar o produto.
- O produto era inserido antes de finalizar arquivos/vínculo. Uma falha posterior podia deixar um rascunho sem mapeamento e gerar outro produto na repetição.
- Teste de conexão dependia de `system_status`, embora importar exija leitura dos produtos, não acesso a esse endpoint administrativo.
- Otimização de imagem indisponível interrompia a cópia inteira, mesmo quando o arquivo original era utilizável.
- O painel não usava o helper autenticado com renovação de sessão nas chamadas privadas.

Não houve acesso à conexão real de um criador: a chave service_role não está disponível no ambiente local. Não foram lidas credenciais de lojas nem iniciadas importações reais. Esses pontos são falhas confirmadas no fluxo do código; não se afirma que expliquem todas as configurações externas de WordPress.

## Novo fluxo

Aplicar integralmente `supabase/migrations/20261016230000_create_woocommerce_import_jobs.sql`. A migration não foi aplicada por ferramentas.

- Botão **Importar todo o catálogo** inicia uma fila sem lista completa de IDs e sem teto artificial de 100/10.000 no percurso.
- Descoberta em páginas de 50 IDs, em ordem ascendente, com cutoff do início da importação. Novos produtos posteriores ficam para outra execução. Modificações/deleções simultâneas na origem não constituem um snapshot transacional remoto.
- Detecta páginas repetidas/desordenadas, para não finalizar falsamente nem continuar num loop de plugin/cache defeituoso.
- Cada execução processa uma fase: descobrir IDs, salvar metadados, copiar uma imagem/arquivo ou avançar o produto. Nunca baixa o catálogo inteiro em uma resposta.
- Progresso, cursor, fila, arquivos pendentes e tentativas ficam no PostgreSQL; browser e cron disputam lease exclusiva de 4 minutos. Uma etapa interrompida é tentada até três vezes; arquivos com falha geram avisos, produtos com falha são identificados e a descoberta irrecuperável pausa a fila.
- Navegador acompanha e acelera as etapas. Sem aba aberta, cron existente continua uma operação por minuto. Não há promessa de velocidade para dez milhões de itens, benchmark desse volume ou aumento de limites/plano da hospedagem.
- Contadores bigint suportam números acima de dez milhões; isto é capacidade do modelo de dados, não teste de carga com dez milhões de produtos.
- Pausa/cancelamento e retomada preservam checkpoint. Uma operação em andamento pode terminar; aplicação de mídia confere lease/situação no banco e recusa jobs cancelados/obsoletos.
- Uma fila ativa por integração. Modo completo pula produtos já mapeados; seleção paginada permite revisar rascunhos importados com mídia pendente.
- Metadados e mídia não publicam produtos: mantém rascunho incompleto e confirmação de preço pendente. Conteúdo já revisado fica protegido; preço alterado continua exigindo revisão conforme integração existente.
- IDs determinísticos evitam duplicar uma inserção interrompida; rascunhos antigos sem mapeamento podem ser reencontrados por loja + fonte + permalink. Não apaga duplicatas antigas automaticamente.
- Arquivos são copiados ao MinIO, em caminhos por job, sem anexar URLs privadas ao retorno da API de progresso. Operação atômica bloqueia alteração de conteúdo já revisado e grava galeria/entrega com IDs estáveis.
- Otimização de imagem falhou: preserva o original permitido no MinIO. SVG continua bloqueado; regras HTTPS, MIME, tamanho, rede privada e redirecionamento das mídias continuam vigentes.
- Limites existentes por arquivo: imagens até 15 MB, vídeos até 50 MB, arquivos digitais até 15 MB; até 10 imagens e 10 arquivos por material. Arquivos que excedem limites são identificados para revisão, não fazem o lote inteiro desaparecer.
- Importação de pedidos, exportação ao Woo e webhooks existentes não foram convertidos integralmente para a nova fila. O trabalho desta mudança cobre a importação manual de produtos.

## Interface/conexão

- Chamadas privadas usam authenticatedFetch e readApiJson, com renovação de sessão e erro legível quando a infraestrutura retorna HTML/texto.
- Teste de conexão lê um produto. Importar aceita chave de leitura; escrita é necessária para exportação e criação de webhooks.
- Botão Atualizar chaves de acesso: preserva integração, mapeamentos e segredo dos webhooks ao atualizar chaves para o mesmo site. Troca de site exige desconexão explícita, para não misturar IDs de catálogos diferentes.
- URL colada com `/wp-admin` ou `/wp-json` é normalizada; requisições autenticadas não seguem redirecionamentos silenciosos.
- Indicadores: localizados, importados, já existentes, falhas e avisos. Últimos 20 detalhes por produto/etapa, sem chaves/URLs privadas.
- Não houve alteração de plano/billing, nem instalação de plugin no WordPress.

## Segurança e validação

- Fila/RPCs service_role, RLS, loja derivada de JWT/cookie + segundo fator. APIs não retornam credenciais, lease_token, URLs de downloads ou plano interno de assets.
- SQL real em PGlite: migration duas vezes; isolamento de loja, exclusão mútua, pausa, contadores >10M, aplicação atômica/idempotente, produto revisado e cancelamento.
- Engine simulado com 501 produtos/11 páginas, fila limitada à página, continuidade após três falhas de imagem, etapa privada de entrega e seleção única sem vetor global de IDs.
- Importador real com mocks: interrupção no mapeamento, reaproveitamento sem duplicar, fase sem downloads, preservação de revisão e fallback de otimização para imagem original.
- API/React: seleção de 150 itens aceita, opção de catálogo completo sem vetor de IDs, escopo próprio, backoff de lease, progresso/pausa/avisos.
- Teste existente de WooCommerce (16 verificações), typecheck Vinext, ESLint dos novos módulos e painel, tamanho de fonte e convenções de migrations.
- Não foi executada importação/autenticação real contra o WordPress de um criador. Requer validação após execução da migration com as chaves reais já configuradas no painel, sem enviá-las no chat.

## Publicação

- Build completo e dry-run concluídos com sucesso; publicada versão Cloudflare `648a680c-412b-449c-9023-6ed794cb008b`.
- Verificação pública após publicação: GET de import-jobs e catalog sem sessão retornam 401 com `private, no-store`. Nenhum job real foi criado nem produto de cliente importado nestes testes.
- Ativação da fila depende da execução manual de `supabase/migrations/20261016230000_create_woocommerce_import_jobs.sql` pelo usuário. Sem a migration, o painel informa que a estrutura ainda não foi ativada.
