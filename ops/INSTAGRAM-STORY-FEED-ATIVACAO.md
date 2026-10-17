# Instagram direto por loja — ativação

## Situação e limite da entrega

O proprietário informou que ainda não existe aplicativo da Educalizando na Meta.
A implementação está preparada para Instagram Login, mas não foi possível testar
uma publicação real, aprovação do aplicativo ou autorização de uma conta sem
esse aplicativo. Nenhum post foi enviado e nenhum token real foi usado nos testes.

O painel oferece o botão “Criar Story ou Feed” nos produtos publicados e o menu
“Instagram · Story e Feed”. Sem ativação, mostra claramente a pendência e permite
preparar/baixar artes; conectar e publicar ficam desabilitados. Não há sucesso
simulado nem substituição silenciosa por compartilhamento manual.

## 1. Executar a migration

Copie e execute no SQL Editor do projeto Supabase:

`supabase/migrations/20261017210000_create_creator_instagram.sql`

Cria somente três tabelas novas da integração, privadas e sem permissões diretas
para anon/authenticated. Não modifica políticas ou registros de products/stores,
RLS existente, checkout, Asaas ou webhooks. O servidor valida o usuário e resolve
a loja pelo creator_id em todas as ações. O cliente não escolhe store_id ou conta
de destino. Tokens nunca são retornados pelo endpoint de status.

## 2. Criar o aplicativo oficial

No [Meta for Developers](https://developers.facebook.com/), crie o aplicativo da
Educalizando e configure a **Instagram API com Instagram Login**. Não usar Basic
Display nem misturar com o fluxo Facebook Login desta implementação.

- OAuth Redirect URI: `https://www.educalizando.com.br/api/creator/instagram/callback`
- Site: `https://www.educalizando.com.br`
- Política: `https://www.educalizando.com.br/privacidade`
- Instruções de exclusão: `https://www.educalizando.com.br/privacidade#instagram`
- Permissões: `instagram_business_basic` e `instagram_business_content_publish`.

Comece em modo de desenvolvimento com contas de teste/participantes autorizados
pela Meta. Para atender contas reais dos criadores, solicite as permissões/acesso
avançado e cumpra a revisão, a verificação e demais exigências aplicáveis exibidas
pela Meta. A existência dos botões não substitui essa aprovação. O dono da conta
deve realizar logins, aceitar termos e concluir verificações; não enviar senhas,
App Secret ou tokens pelo chat.

Feed exige conta profissional. Nesta integração, publicação de Stories está
limitada ao tipo Empresa (BUSINESS). Perfil pessoal precisa ser convertido a uma
modalidade compatível pelo próprio titular. A integração não solicita acesso a
mensagens, comentários ou anúncios.

## 3. Configurar o Worker

Cadastre no servidor de produção, usando os Secrets do Worker ou `wrangler secret
put`, nunca variáveis NEXT_PUBLIC_ ou arquivos versionados:

| Variável | Conteúdo |
|---|---|
| INSTAGRAM_APP_ID | Instagram App ID da configuração Instagram Login. |
| INSTAGRAM_APP_SECRET | Instagram App Secret correspondente. |
| INSTAGRAM_GRAPH_API_VERSION | Versão disponível e suportada indicada na configuração/documentação da Meta, no formato vNN.N. |
| INSTAGRAM_TOKEN_ENCRYPTION_KEY | 32 bytes aleatórios codificados em base64; manter estável e guardar com segurança. |
| INSTAGRAM_PUBLISHING_ENABLED | `true` somente quando a equipe decidir ativar o fluxo oficial. |

A chave de cifra pode ser gerada no computador do responsável com
`node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"`.
Não reutilizar segredos de pagamento e não trocar a chave sem um plano de
reconexão/migração: tokens cifrados com a chave antiga deixam de abrir.

O MinIO e o Supabase já configurados continuam sendo utilizados. Não são criados
novos bindings KV/R2/D1, cron ou serviços pagos de imagem.

## 4. Validar antes da liberação geral

1. Com aplicativo e permissões de teste ativos, entrar como criador e conectar
   uma conta profissional própria pelo botão oficial.
2. Conferir o @perfil mostrado, escolher um produto publicado da mesma loja,
   gerar a arte e revisar o formato e a legenda.
3. Após autorização explícita do titular, testar uma publicação no Feed e uma
   no Story. A confirmação é o botão “Confirmar e publicar”, não gerar a arte.
4. Conferir no Instagram e no histórico. Só aparece Publicado após resposta da
   Meta ou confirmação posterior do container. Não repetir um envio incerto.
5. Testar conexão cancelada, reconexão, autorização expirada, loja diferente e
   desconexão. A reconexão invalida a conexão anterior usada por jobs pendentes.
6. Concluir a revisão da Meta e só então liberar para os criadores elegíveis.

## Como o fluxo funciona

As artes são JPEG, 1080×1920 no Story e 1080×1350 no Feed. São montadas no navegador
a partir da capa, nome da loja, título e preço da versão final cadastrados. Não
há geração de conteúdo por IA nem alteração do produto. A capa precisa permitir
acesso público/CORS; a falha de leitura aparece antes de qualquer publicação.

A arte só é enviada ao MinIO após o criador confirmar a publicação. O upload é
direto, com uma autorização temporária gerada automaticamente, e o arquivo fica
em `public-images/uploads/{store_id}/instagram/{job_id}.jpg`. A Meta acessa essa
imagem pública. Nenhum arquivo pago ou credencial é usado como imagem de divulgação.

O Feed recebe a legenda revisada. Story recebe somente a imagem: a API deste
fluxo não adiciona sticker de link, música, enquete nem a legenda de apoio. URLs
na legenda do Feed não são links clicáveis. O painel informa essas diferenças.

O servidor prepara o container, acompanha processamento e faz uma publicação
única por solicitação. A consulta GET nunca publica. O botão de concluir uma
publicação pendente faz POST explícito. As consultas automáticas ocorrem somente
durante o envio aberto no painel e têm limite; não há polling permanente.

Em timeout após `media_publish`, o estado é Confirmação pendente. Não existe
reenvio automático dessa operação, pois a Meta pode já ter publicado. É possível
consultar o estado do container para confirmar PUBLISHED. A conferência no próprio
Instagram continua necessária quando o resultado não puder ser recuperado.

Tokens são cifrados com AES-256-GCM e vinculados à loja. A renovação acontece sob
demanda quando uma autorização válida está próxima do vencimento, respeitando
a janela mínima de atualização. Uma autorização expirada ou revogada exige
reconectar. Não prometer conexão eterna sem atividade.

Desconectar remove a credencial local e impede novos envios. Publicações já
aceitas pela Meta podem terminar, e publicações já existentes não são apagadas.
O histórico e as artes não são removidos automaticamente pela desconexão;
instruções para solicitar exclusão estão na política de privacidade.

## Verificação técnica e arquivos

Verificação em 17/10/2026: lint sem erros (17 avisos já existentes), typecheck
Vinext, teste do Instagram, regressões de upload direto/armazenamento e limite
de tamanho dos fontes aprovados. Build de produção Vinext + empacotamento
Wrangler com `--dry-run` aprovado. Prévia isolada no navegador confirmou JPEG
Story 1080×1920, Feed 1080×1350, download e bloqueio de conexão/publicação sem
configuração. A prévia usa dados de exemplo locais e não envia posts.

Nenhum aplicativo da Meta foi criado ou aprovado nesta entrega; nenhuma conta
real foi conectada e nenhuma publicação real foi enviada. A migration deve ser
executada pelo administrador e a ativação depende da configuração abaixo.

`npm run test:instagram` cobre cifra por loja, OAuth state, campos mínimos,
isolamento, repetição e concorrência, resultado incerto sem duplicação, JPEG
Story/Feed, preço real, contratos com respostas simuladas da Meta e proteção dos
segredos. Não equivale a aprovação ou teste real do provedor.

| Arquivo | Motivo |
|---|---|
| supabase/migrations/20261017210000_create_creator_instagram.sql | Tabelas privadas de conexão, estado OAuth e publicações. |
| src/lib/instagram-contract.ts | Formatos, estados e legenda com dados reais e URL canônica da loja. |
| src/lib/instagram-security.ts | Ativação explícita, nonce, callback fixo e cifra vinculada à loja. |
| src/lib/instagram-provider.ts | Contrato OAuth/publicação da Meta com timeout e erros sem tokens. |
| src/lib/instagram-store.ts | Autenticação, resolução da loja, corpo limitado e renovação de token. |
| src/lib/instagram-publishing.ts | Upload JPEG, jobs persistidos, concorrência e confirmação sem duplicação. |
| src/lib/instagram-artwork.ts | Arte local nas dimensões corretas, sem serviço de imagem pago. |
| src/lib/instagram-client.ts | Requisições autenticadas; só repete uma falha de autenticação 401. |
| src/lib/object-storage.ts | Leitura HEAD para conferir o JPEG antes de enviar à Meta. |
| src/app/api/creator/instagram/route.ts | Status privado, início da conexão e desconexão. |
| src/app/api/creator/instagram/callback/route.ts | Callback com cookie/estado descartável e gravação cifrada. |
| src/app/api/creator/instagram/posts/route.ts | Preparar, concluir e consultar apenas publicações da loja autenticada. |
| src/app/dashboard/instagram/page.tsx | Área de criação, conexão, revisão e histórico, com pendências claras. |
| src/components/creator/InstagramProductButton.tsx | Botão por produto publicado. |
| src/app/dashboard/produtos/page.tsx | Integrar o botão aos cartões existentes. |
| src/components/dashboard/Sidebar.tsx | Acesso pelo menu de marketing do criador. |
| src/app/privacidade/page.tsx | Explicar os dados da integração, desconexão e exclusão. |
| scripts/verify-instagram-publishing.cjs | Regressão funcional e de isolamento. |
| package.json | Comando de teste do módulo. |
| ops/INSTAGRAM-STORY-FEED-ATIVACAO.md | Guia de ativação, limites e inventário. |

Referências oficiais: [Instagram Login](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login/),
[publicação](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/content-publishing/),
[coleção oficial da Meta](https://www.postman.com/meta/workspace/instagram/documentation/23987686-9386f468-7714-490f-9bfc-9442db5c8f00).
