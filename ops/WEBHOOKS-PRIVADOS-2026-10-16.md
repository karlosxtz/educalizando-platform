# Webhooks privados por lojista

## Interface para criadores iniciantes

Redesenho publicado na versão `77d8e0b9-dd17-4965-9208-499354db1e27`. Página dividida em apresentação, explicação da origem do endereço, atalhos de configuração, conexões, histórico filtrável e guia de três passos. O endereço de recebimento é fornecido pelo destino; a UTMify usa a credencial e o endereço fixo já configurado. Não existe criação de endpoint de entrada da Educalizando nesta função de envio de eventos.

Inclui presets funcionais de vendas e catálogo, cópia do endereço cadastrado, formulários com ajuda contextual, edição com estado retornado pelo servidor, erros em linguagem simples e opções técnicas recolhidas. A chave HMAC é exibida apenas em integrações personalizadas, evitando pedir uma segunda chave sem uso na configuração UTMify. O histórico lê somente a marca `is_test` do JSON do evento para diferenciar o teste UTMify de uma venda real; não retorna o snapshot completo. Consulta de JSON documentada em https://supabase.com/docs/reference/javascript/select.

Validação: TypeScript, ESLint, limite de arquivos, testes existentes de segurança/entrega e novo `node scripts/verify-store-webhook-ui.cjs` passaram. O teste usa React real para renderizar os componentes e aciona os presets, conferindo a atualização dos eventos selecionados e a distinção teste/pagamento. Build e deploy passaram, mantendo o cron por minuto. A prévia visual local não foi alcançada pelo navegador integrado; não foi realizada inspeção visual nem envio real nesta atualização. Nenhuma migration adicional.

## Clareza de ativação e teste

Atualização publicada na versão `26619b14-620d-44ae-899d-63feec5c9795`: criação usa **Salvar e ativar integração**, edição usa **Salvar alterações**, pausa/retomada usam **Pausar integração / Ativar integração** e o teste usa **Testar conexão**. Textos explicam que a conexão de teste é real, com dados fictícios, e que o resultado depende do histórico de entrega. Teste não cobra nem cria venda na Educalizando; pode acionar automações do destino. Edição de integração pausada preserva a pausa e informa esse estado. Nenhuma migration adicional. TypeScript, ESLint da página e build de produção passaram. Não houve envio real de teste nesta atualização.

Painel: `/dashboard/webhooks`, em **Marketing e crescimento → Webhooks e Integrações**.

Publicado em 16/10/2026 no Worker `educalizando-app`, versão `5af45dc9-07fd-4d85-8f6f-2cdcd2a12f88`. Deploy confirmou o agendamento `* * * * *`. Não houve alteração de plano de hospedagem.

## Banco e privacidade

Migration: `supabase/migrations/20261016150000_create_private_store_webhooks.sql`. O usuário informou que executou o arquivo em 16/10/2026. Não houve execução no Supabase pelas ferramentas do agente.

- Tabelas de destinos, eventos e entregas com RLS. Navegador/anon não têm acesso direto. API verifica a sessão e deriva a loja pelo criador autenticado, nunca pelo `store_id` recebido do navegador.
- Chaves de assinatura e credenciais UTMify criptografadas com AES-256-GCM, vinculadas ao ID da loja. A chave da plataforma é derivada da configuração criptográfica existente; mantenha essa configuração estável.
- Credenciais UTMify não retornam ao navegador. A chave de assinatura aparece uma vez na criação ou renovação. Destinos HTTPS e endereços DNS públicos são verificados, redirecionamentos não são seguidos. A validação DNS não constitui fixação de IP durante a conexão.
- Snapshot do evento usa campos permitidos; não inclui arquivos privados nem credenciais de pagamento. Dados do comprador só entram no envio se autorizados na integração; UTMify exige essa autorização.
- Limite de 10 destinos por loja, inclusive sob criação concorrente. Chaves estrangeiras compostas impedem misturar endpoint/evento de lojas diferentes.

## Eventos e envio

Eventos de pedidos (criação e mudanças de status), materiais, combos, clubes, assinaturas, pagamentos de clube e teste. Consulte a lista efetiva no formulário. UTMify recebe os eventos de pedidos compatíveis; demais eventos são destinados aos webhooks personalizados.

Triggers registram eventos na mesma transação da alteração de negócio. O pagamento não espera uma conexão HTTP externa. Atualizações de visualizações/vendas do produto não geram um evento por acesso.

Worker agenda o processamento a cada minuto, até cinco entregas por execução. A fila também pode ser processada pelo painel ou pela rota cron autenticada existente. Cada POST tem prazo de oito segundos. Fila durável, lease de 90 segundos, token por tentativa e confirmação condicionada ao token impedem um worker antigo de sobrescrever o recibo de outra tentativa. Eventos da mesma entidade e destino são processados em ordem enquanto houver pendências anteriores.

Até oito tentativas em erros de conexão, HTTP 408, 425, 429 e 5xx, com intervalo progressivo. Demais respostas falham e ficam disponíveis para revisão. O botão de repetição da UTMify recusa um evento antigo quando o pedido já mudou de status. Edição/pausa/renovação cancelam envios pendentes da versão anterior; envios já em andamento podem terminar.

Entrega é **ao menos uma vez**: o destino deve deduplicar pelo ID do evento. Uma interrupção depois de o receptor aceitar o POST pode causar repetição. Excluir integração remove também o histórico daquele destino, conforme confirmação no painel. O histórico visível mostra as últimas 50 entregas; não há limpeza automática de registros antigos nesta implementação.

## UTMify e campanhas

Endereço de envio fixo da UTMify, token em `x-api-token`, estados compatíveis, datas UTC e valores em centavos. Comissão da loja corresponde ao líquido do pedido; a diferença para o total reúne as demais deduções. Um método de pagamento desconhecido não é apresentado como PIX.

UTMs e `src`/`sck` são preservados por sessão até o checkout. Identificadores `fbclid`, `gclid` e `ttclid` ficam no evento genérico; o adaptador UTMify usa os campos do contrato da integração. A recusa de rastreamento da loja é respeitada. Atribuição sem contexto de loja pode ser associada na navegação seguinte por até 30 minutos. Não há importação de vendas anteriores nem criação automática de destino/token.

## Validação

- `node scripts/verify-store-webhooks.cjs`: criptografia, assinatura, endereços privados, campos sensíveis, valores UTMify, tentativas, redirecionamento, versões de configuração e autenticação/isolamento da API. HTTP simulado, sem envio a clientes ou integrações reais.
- `node scripts/verify-store-webhook-migration.cjs`: SQL executado duas vezes em PostgreSQL local PGlite, RLS/privilégios, chaves entre lojas, triggers, ordem da fila, leases, limite de tentativas e de destinos. Dependência de teste instalada somente em `.cloudflare/sql-test`.
- TypeScript, ESLint dos novos módulos, limites de tamanho, idempotência de checkout e cálculos financeiros.

Não foram fornecidas credenciais UTMify para validar uma entrega real. A disponibilidade da infraestrutura Cloudflare Free permanece sujeita aos limites da conta; esta implementação não muda o plano nem garante ausência de falhas externas.

Após publicar, a página privada redirecionou corretamente para login no navegador sem sessão. A API publicada recusou o acesso anônimo com a mensagem de autenticação esperada. A sessão do navegador não estava conectada; criação/edição de um destino e entrega real autenticada em produção ainda precisam ser conferidas após login e cadastro da integração. Nenhuma credencial de lojista nem destino fictício foi cadastrado em produção.
