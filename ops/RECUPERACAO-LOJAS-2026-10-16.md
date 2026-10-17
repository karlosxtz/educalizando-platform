# Recuperação de compras originadas nas lojas

Painel: Marketing e crescimento → Recuperar compras (`/dashboard/carrinhos`).

## Ativação

Aplicar integralmente `supabase/migrations/20261016220000_create_store_cart_recovery.sql` pelo SQL Editor. A migration não foi aplicada por ferramentas. Enquanto ela não existe, o painel mostra aguardando ativação e o checkout continua funcionando; erros da coleta opcional não impedem pagamentos.

## Escopo

- `CartProvider` identifica a origem de cada adição: loja ou marketplace. A loja não importa itens antigos/sem origem ou adicionados no marketplace só porque eles pertencem ao mesmo lojista.
- `StoreCartTracker` captura apenas itens originados na loja. Não roda no carrinho global nem nas rotas de checkout.
- `useCheckoutRecovery` cobre checkout direto de produto/PLR, combo e carrinho da loja. Exclui explicitamente `marketplaceOrigin`.
- API de captura exige Origin e Referer do endereço da própria loja, recusa `origem=marketplace`, reconsulta produtos/combos publicados da loja e calcula valores no servidor. Preços e títulos recebidos do visitante não são aceitos.
- Um browser token privado por loja mantém a tentativa, com validade local de sete dias. A API de relatório não expõe esse token. Writes são serializados no navegador.
- Carrinhos aparecem como ativos; tornam-se abandonados após 20 minutos sem atualização. Esvaziados e concluídos têm situações distintas. Links expiram após sete dias.
- Tentativas já vinculadas a pagamento não são substituídas por um carrinho diferente: a gravação sinaliza rotação da sessão, preservando o pedido e o snapshot anterior.
- Checkout autenticado vincula a tentativa ao pedido validado, inclusive em retomada idempotente. O módulo não cria cobranças, altera preços comerciais, acessos ou cálculos financeiros.
- Trigger de pagamento aprovado fecha o carrinho e seus antecedentes de recuperação. Atualizações atrasadas não reabrem a tentativa paga. Relatório e ações também conferem a situação do pedido.

## Privacidade e lembretes

- Visitante aparece como anônimo quando só adiciona itens. Nome/WhatsApp só são enviados e armazenados após marcar o consentimento específico da loja no checkout.
- Não armazena email, CPF, identidade de conta ou IP nesta tabela. Contém materiais, preço estimado, datas e, quando autorizado, contato.
- Desmarcar a opção revoga a autorização e limpa o contato; o link público também oferece cancelamento. A autorização não é pré-selecionada.
- Versão atual oferece lembrete manual: preparar mensagem → abrir WhatsApp da loja → enviar → marcar como enviado. Preparar/abrir não é apresentado como envio real ou entrega confirmada.
- A preparação exige abandono, consentimento vigente, contato e ausência de lembrete marcado como enviado/pagamento concluído. Não há disparo automático, credencial Evolution nova ou tarefa agendada nova.
- O lembrete antigo do marketplace permanece separado; o checkout da loja não cria mais entradas nele. Registros antigos não são importados para o novo relatório.

## Retomada

- `/retomar-compra/[token]`: consulta apenas materiais e loja, nunca dados de contato, sessão de escrita ou dados do pedido.
- Revalida disponibilidade e preços; item indisponível não é silenciosamente substituído. O cliente revisa antes de clicar para retomar.
- Produtos: restaura o carrinho da loja, preservando itens de outras lojas. Mantém licença PLR. Combo: volta ao checkout direto do combo.
- Não cobra, autentica ou libera conteúdo apenas com o link. O checkout normal mantém suas validações de identidade e pagamento.
- Em outro navegador, a nova tentativa pode apontar para o carrinho original; compra aprovada fecha também o original. Cancelar lembretes não exige login, mas exige o token de recuperação.

## Painel

- Privado por lojista, autenticação e segundo fator existentes, escopo derivado no servidor.
- Períodos 7/30/90 dias, situações e os 100 registros mais recentes. Totais agregados no PostgreSQL abrangem todos do período.
- Indicador de compras concluídas não afirma que foram recuperadas pelo lembrete. Valor dos abandonos é estimativa, não receita.
- Copiar link, preparar mensagem e marcação explícita de envio manual. Não existe contato disponível sem consentimento.
- RLS e revogação de grants para anon/authenticated na tabela/funções; apenas service_role acessa os dados diretamente.
- Dados não são retroativos. Armazenamento indisponível no navegador ou coleta bloqueada pode impedir registro; a compra não é bloqueada. Não adiciona retenção automática do histórico.

## Verificação

- `node scripts/verify-store-cart-sql.cjs`: PostgreSQL real em PGlite, migration duas vezes, consentimento/revogação, inatividade, escopo de loja, vínculo de pedido, conversão da recuperação, congelamento de carrinho com pagamento e permissões privadas.
- `node scripts/verify-store-cart-recovery.cjs`: preço/catálogo do servidor, produtos/PLR/combos, exclusão de marketplace, origem da adição, ausência de contato sem consentimento, escopo de leitura, cancelamento e ausência de dados privados no link público; renderização React do painel. Nenhuma mensagem externa enviada.
- Typecheck Vinext, ESLint dos novos módulos, testes financeiros e idempotência do checkout, limites de fonte e migrations.

## Publicação

Build completo e dry-run finais aprovados; publicado no Worker `educalizando-app`, versão `e56bd6d5-806e-403a-91d8-5a8f46703f3e`, mantendo o cron existente.
Verificação de produção sem gravação: relatório sem login retornou 401; link de recuperação inválido retornou 400; captura sem Origin retornou 403. Nenhuma cobrança ou mensagem foi enviada nos testes.
A migration segue pendente de execução manual pelo proprietário. Não houve teste autenticado de carrinho real em produção após a ativação do banco; fluxos de gravação/consentimento/conversão foram exercitados localmente com rotas reais, mocks e PostgreSQL PGlite.
