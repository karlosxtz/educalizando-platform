# Pinterest por loja — implementação e ativação

## Estado

Implementação do painel, OAuth, fila e envio via API v5. Não confundir interface publicada com integração ativada: faltam executar a migration, cadastrar o aplicativo, configurar Secrets e validar uma conta real. Nenhum Pin real foi enviado durante os testes automatizados. Nenhum produto/cadastro existente foi modificado.

Local: **Marketing e crescimento → Pinterest · Divulgação**, `/dashboard/pinterest`.

## Comportamento

- Cada loja conecta sua conta por OAuth e seleciona uma pasta pública acessível a essa conta.
- A automação vem desligada; só novos produtos que passarem a `publicado` depois de sua autorização entram na fila. Novos produtos já inseridos como publicados também entram. Não há envio retroativo em massa.
- Rascunhos e materiais excluídos não são enviados. Antes do envio, o servidor consulta novamente produto, loja e conexão.
- Um Pin por produto/loja. Alterar um cadastro não gera repostagem. Um Pin confirmado não pode ser reenviado pelo módulo. Falhas confirmadas e cancelamentos podem voltar à fila por confirmação manual.
- Ao selecionar um produto antigo, o painel mostra capa, título, descrição, destino e pede confirmação antes de enfileirar.
- O Pin utiliza exclusivamente a capa pública cadastrada no MinIO, título e descrição reais e URL canônica de produto da loja. Não envia arquivos digitais pagos, dados de clientes nem URL de entrega.
- Links incluem `utm_source=pinterest&utm_medium=organic&utm_campaign=materiais`. São identificadores para ferramentas de análise já utilizadas; este módulo não inventa atribuição, métricas ou vendas.
- Tokens e refresh tokens ficam cifrados AES-256-GCM com autenticação vinculada à loja. Não são retornados ao navegador.
- Reutiliza o cron existente, no máximo três trabalhos por execução, com claim transacional e um trabalho por conexão em andamento. Renovação de token é protegida por lease.
- HTTP 429 pode retornar à fila com espera crescente, até seis tentativas. Timeout, 408, 5xx ou resposta ambígua de criação ficam como **confirmação pendente**; não há retry cego que possa duplicar Pins.
- Pausar cancela trabalhos automáticos ainda na fila. Desconectar cancela pendentes e remove credenciais locais. Envios já iniciados podem terminar. A remoção da autorização no Pinterest pode ser feita nas configurações de aplicativos conectados da própria conta.
- A pasta é registrada no momento do enfileiramento. Alterar a pasta padrão afeta os próximos trabalhos; trabalhos já pendentes mantêm a pasta escolhida inicialmente.

## 1. Migration

Execute **inteiro** no SQL Editor do Supabase:

`supabase/migrations/20261018010000_create_creator_pinterest.sql`

Cria somente três tabelas privadas novas, uma função de claim e um trigger de outbox nos produtos. O trigger só insere na fila: não faz chamada externa nem altera os campos do produto. Políticas/RLS existentes, preços, checkout, Asaas e webhooks ficam intactos. As novas tabelas não têm acesso direto por anon/authenticated; o acesso acontece somente no servidor após autenticação e conferência da loja.

Não execute SQL parcial. Se houver erro de migration, interrompa a ativação e registre a mensagem sem dados sensíveis.

## 2. Aplicativo oficial

1. Entre em https://developers.pinterest.com/apps/ com a conta business responsável pela Educalizando.
2. Complete a verificação de email e aceite os termos pessoalmente ou mediante autorização explícita. Não compartilhar senhas/códigos no chat.
3. Cadastre o app Educalizando, site `https://www.educalizando.com.br` e a política de privacidade vigente do site.
4. Callback exato: `https://www.educalizando.com.br/api/creator/pinterest/callback`.
5. Permissões solicitadas no OAuth: `boards:read`, `pins:write`, `user_accounts:read`. Não solicita anúncios, dados financeiros, exclusão de Pins ou acesso a pastas secretas.
6. Solicite Trial para testar e Standard para o uso em produção conforme o processo vigente do Pinterest. Sandbox não é liberação pública.

Descrição sugerida: “A Educalizando é uma plataforma de lojas de materiais didáticos digitais. Cada criador autoriza sua própria conta Pinterest, escolhe uma pasta pública e pode publicar Pins de seus próprios produtos, com imagem pública, título, descrição e link para sua loja. A publicação automática de novos lançamentos é opcional, pode ser pausada e não publica conteúdo de outras contas.”

## 3. Secrets exclusivos do Worker

Configurar em **educalizando-app → Settings → Variables and Secrets**, nunca no código/cliente/git:

- `PINTEREST_APP_ID`: ID do app.
- `PINTEREST_APP_SECRET`: segredo do app.
- `PINTEREST_TOKEN_ENCRYPTION_KEY`: chave aleatória de 32 bytes codificada em base64, exclusiva da integração.
- `PINTEREST_ENABLED=true`: somente depois da migration e configuração do aplicativo.
- `PINTEREST_SANDBOX=true`: obrigatório durante validação inicial.

Sem configuração completa, o painel mostra “Integração em preparação” e não promete conexão funcional. Ausência de `PINTEREST_SANDBOX=false` mantém o ambiente de testes por padrão. Não reutilizar a chave do Instagram.

## 4. Validação real e produção

1. Conectar uma conta autorizada e conferir a identificação no painel.
2. Carregar pastas, escolher uma pública e salvar com automação desligada.
3. Selecionar um produto próprio, conferir prévia, destino e pasta; obter autorização do responsável antes de confirmar o Pin de teste.
4. Conferir o histórico e o Pin no Pinterest. Não repetir se o resultado for incerto.
5. Testar automação com um novo material publicado pelo criador, após autorização explícita; testar rascunho, pausa e outra loja sem opt-in.
6. Após acesso Standard aprovado, configurar `PINTEREST_SANDBOX=false` e reconectar a conta. Tokens do Sandbox não são reutilizados silenciosamente em produção.
7. Validar um Pin real aprovado pelo responsável e só então anunciar publicação direta geral.

Não foram executados testes reais de banco/API até a ativação externa. Testes de código usam mocks; não substituem esses passos.

## Consumo e operação

Sem novos bindings KV/R2, nova transformação de imagem ou geração de arte no Worker. O Pinterest busca a capa pública diretamente no MinIO. O módulo não cria anúncios pagos.

Enquanto `PINTEREST_ENABLED` não está configurado, o processador retorna antes de consultar o banco. Quando ativado, uma fila vazia resulta em aproximadamente **43.200 chamadas RPC de claim por mês de 30 dias**, dentro do cron já existente; com trabalho, até três claims e envios por execução. Isso adiciona consultas ao Supabase e CPU/subrequests ao Worker; não há garantia de custo zero ou teto automático de US$5. Não foi criado mecanismo novo de cobrança/billing. Verificar latência/CPU no Worker e logs do Supabase antes de elevar o limite.

## Arquivos e motivos

- `src/app/dashboard/pinterest/page.tsx`: painel de conexão, pastas, opt-in, revisão, prévia e histórico; sem polling.
- `src/components/dashboard/Sidebar.tsx`: entrada em Marketing e crescimento.
- `src/app/api/creator/pinterest/route.ts`: status, conexão, pastas, preferências e desconexão.
- `src/app/api/creator/pinterest/callback/route.ts`: state, troca OAuth e armazenamento cifrado.
- `src/app/api/creator/pinterest/posts/route.ts`: valida produto/loja e enfileira envio manual idempotente.
- `src/lib/pinterest-contract.ts`: payload real, limites de texto, imagem pública e link da loja.
- `src/lib/pinterest-security.ts`: configuração, state, escopos e criptografia.
- `src/lib/pinterest-provider.ts`: HTTP v5, timeouts, tokens e pastas.
- `src/lib/pinterest-store.ts`: autenticação, isolamento e renovação serializada.
- `src/lib/pinterest-publishing.ts`: execução limitada da fila e estados seguros.
- `cloudflare/worker.js`: acopla fila ao cron existente.
- `supabase/migrations/20261018010000_create_creator_pinterest.sql`: tabelas privadas e outbox/claim.
- `scripts/verify-pinterest-publishing.cjs` e `package.json`: verificações da integração.
- Este documento: ativação, limitações, operação e arquivos.

## Validação do código

- Lint: sem erros; 17 avisos preexistentes.
- Typecheck Vinext: aprovado.
- Build completo pelo script do projeto em modo de validação (`--dry-run`): aprovado.
- `test:pinterest`: autenticação/origem, OAuth, cifra e isolamento por loja, URL pública, opt-in, rascunho, troca de conexão, timeout/5xx ambíguo e 429 com espera; aprovado com mocks.
- `test:instagram`: regressão aprovada.
- `test:migrations` e `test:source-size`: aprovados.
- `test:cloudflare-free`: aprovado.

## Referências oficiais consultadas

- https://developer.pinterest.com/docs/getting-started/set-up-authentication-and-authorization/
- https://developer.pinterest.com/docs/work-with-organic-content-and-users/create-boards-and-pins/
- https://developer.pinterest.com/docs/developer-tools/sandbox/
- https://dev.pinterest.com/docs/key-concepts/access-tiers/
