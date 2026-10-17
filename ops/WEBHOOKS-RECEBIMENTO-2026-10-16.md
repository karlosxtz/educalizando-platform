# Recebimento privado de webhooks

Painel: Marketing e crescimento → Webhooks e Integrações → **Receber dados**. Atalho: `/dashboard/webhooks#receber`.

Publicado em 16/10/2026 na versão Cloudflare `4aceb269-f2af-43b7-82b1-6bee5c513c93`. O agendamento de saída por minuto foi preservado. A rota pública publicada foi aberta com identificador/chave inválidos e recusou o acesso com a mensagem esperada; não foi utilizado link privado de lojista real.

## Ativação

Migration nova: `supabase/migrations/20261016180000_create_store_webhook_receivers.sql`. Entregue para execução manual no projeto correto; a aplicação no Supabase de produção não foi verificada pelo agente. Execute o arquivo inteiro. A migration anterior de webhooks de saída já foi informada como aplicada pelo usuário. A aba nova funciona em modo de espera enquanto as tabelas não existem; a aba de saída continua disponível.

## Funções implementadas

- Gerar até dez links privados ativos/pausados por loja, copiar, revelar/ocultar, conferir disponibilidade por GET, editar nome/permissões, pausar/ativar e renovar o link. Arquivamento mantém o histórico e é recusado quando há vendas externas vinculadas; nesses casos use pausa, permitindo retomar o acompanhamento.
- Link contém token aleatório de 256 bits. Token é verificado por hash com comparação constante e revalidado no RPC; a versão criptografada com AES-GCM vinculado à loja permite ao proprietário recuperar o link. Rotação invalida o endereço anterior. Mantenha a configuração criptográfica global estável.
- JSON genérico, inclusive formatos nativos de outras plataformas, é registrado como aviso. Não se adivinha mapeamento ou pagamento a partir de campos arbitrários.
- Contrato de ações normalizadas: `product.upsert`, `category.upsert`, `customer.upsert`, `order.upsert`, `access.grant`, `access.revoke`. Modelos disponíveis no guia da aba. Ações reconhecidas usam validação estrita; campos protegidos ou de outra loja não são aceitos.
- Produtos: título, descrição, preço final, tipo, capa HTTPS pública, tags, temas/datas (`seasonal_tags`), até cinco categorias e níveis, páginas, faixa indicada, detalhes do formato e cor. Novos produtos em rascunho. Campos não enviados são preservados nos existentes. Slug existente, publicação, arquivos privados e licença PLR não são trocados. Preço e indicação de gratuito ficam coerentes; preço original inválido para o novo preço é removido. Não há download/importação de arquivos binários.
- Categorias: criação/edição de categorias próprias; globais não podem ser sobrescritas. Identificadores externos são associados à entidade criada por aquela origem.
- Clientes: cadastro separado de contatos externos, com nome, e-mail, telefone e consentimento de marketing explicitamente informado pela origem. Não há criação de conta, convite, e-mail ou inscrição em campanhas automática.
- Vendas externas: registro privado separado dos pedidos internos, com origem/ID, status, comprador, moeda, total e materiais da própria loja. Sem saldo, comissão, cobrança ou saque na Educalizando. O pagamento é informado pela origem autenticada; não há consulta de confirmação financeira a gateways genéricos.
- Acesso: exige permissão específica além de vendas, pedido externo pago e materiais publicados da própria loja. Somente versão final; não concede PLR. Usa a identidade de conta com e-mail confirmado. Comprador sem conta confirmada fica pendente; ao abrir a biblioteca, o RPC vincula somente os acessos do próprio e-mail confirmado. Não aceita identidade de aluno enviada pela origem.
- Refund/chargeback revoga somente os registros de acesso da respectiva venda externa. Outros pedidos/acessos permanecem. Pedido pago não pode regredir a pendente/falhou/cancelado; estados finais de reembolso/chargeback não voltam a pago. Identidade, itens e valores de pedido já pago não podem ser redirecionados/reescritos. Eventos antigos preservam versões mais recentes.
- Histórico com consulta individual dos dados, reprocessamento de falhas, listagens dos últimos cinquenta contatos e vendas. Até oito tentativas por aviso; reprocessamento explícito do lojista permite iniciar nova rodada. `test:true` registra teste sem executar ações de negócio. O botão Verificar link faz GET real e não cria evento nem comprova uma origem externa; o teste de envio deve partir da plataforma de origem.

## Segurança e limites

Novas tabelas com RLS e sem permissões diretas para anon/authenticated. API de gestão verifica sessão/2FA via helper existente, origem de requisição e deriva a loja do usuário; IDs de loja no corpo não definem o escopo. Chaves estrangeiras e validações no RPC reforçam o vínculo por loja.

Transações aplicam evento e ação atomicamente: falha de ação faz rollback das mudanças e preserva apenas o recibo de falha. Idempotência por origem+ID, hash de JSON normalizado independente da ordem dos campos, conflitos de reutilização de ID e controle de versão temporal. Sem ID no JSON ou cabeçalho X-Event-Id/Idempotency-Key, cada recebimento gera um ID novo; esses reenvios não são deduplicados. Falhas de cache depois da transação não mudam uma confirmação em erro.

Corpo de até 64 KB, até 12 níveis e orçamento de 4.000 nós de dados; leitura do corpo limitada a dez segundos. Máximo de 120 requisições por minuto por origem, sem confiar em IP fornecido por ela. Históricos redigem campos reconhecidos de senha, token, credenciais/chaves e cartão. Isso é filtragem por nome de campo, não classificação infalível de texto arbitrário. Conteúdo recebido não é escrito em console nem ecoado na resposta pública. Links privados continuam sendo credenciais, podendo constar nos logs operacionais da infraestrutura; compartilhe somente com a origem autorizada.

Produtos alterados pela entrada não são retransmitidos automaticamente à saída, para evitar ciclos. O novo RPC usa uma configuração local da transação; o trigger de saída retorna cedo somente nesse contexto. Alterações normais continuam emitindo eventos. Nenhuma mudança de plano de hospedagem ou promessa de eliminar os limites da infraestrutura.

Assinaturas particulares de terceiros, esquemas nativos de cada fornecedor, publicação automática de materiais, upload de arquivos, criação de conta, convite por mensagem, PLR e assinaturas de clubes não são implementados como ações genéricas. Os dados desses eventos podem ser recebidos como avisos; automações específicas exigem o contrato normalizado ou uma integração própria. WooCommerce possui integração específica já existente.

## Validação

- `node scripts/verify-webhook-receivers-sql.cjs`: migration executada duas vezes em PostgreSQL PGlite isolado, permissões, loja estrangeira, rascunho, deduplicação, integridade de pedido pago, reembolso parcial por fonte, identidade confirmada e ausência de eco para saída. Nenhum banco real alterado.
- `node scripts/verify-webhook-receivers.cjs`: rotas reais transpiladas com banco simulado, token, origem da gestão, limite de corpo/profundidade, formatos nativos e listas, ações protegidas, redaction, hash, RLS na API e modo antes da migration. Nenhum envio HTTP real.
- `node scripts/verify-webhook-receivers-ui.cjs`: componentes renderizados com React real, espera pela migration, link privado, permissões e guia.
- Testes existentes de saída e UI, acesso final versus PLR, nomes de migrations, tamanho de fonte, TypeScript, ESLint e build de produção.

Recebimento externo autenticado em produção depende de aplicar a migration e gerar uma conexão. Não houve criação de link real, recebimento de dados de cliente, concessão/revogação real ou envio de mensagens nestes testes.
