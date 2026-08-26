# Auditoria Rigorosa — Perfis de Usuário e Fluxo de Vendas (Preparação para Resend)

## 1. O Modelo de Usuários e Perfis (Roles)
Ao inspecionar o schema e os serviços principais (como o `order-service.ts` e `types.ts`), percebe-se que a plataforma não utiliza um campo único engessado de "role" (ex: `role = 'admin'`). O sistema de perfis é construído sobre a **existência de vínculos** (Foreign Keys) a partir do ID de autenticação do Supabase (`auth.users.id`).

- **O Aluno (Comprador):** É identificado pelo `buyerEmail` e `buyerName` no momento do checkout e possui um perfil em `StudentProfile` (vinculado pelo e-mail ou `student_id`). Ele recebe permissões na tabela de acessos (`student_product_access`).
- **O Produtor (Criador):** É identificado pelo fato de possuir uma Loja (`Store`). O campo `creator_id` na loja ou no pedido aponta para o ID de autenticação do dono.
- **O Afiliado:** É identificado por possuir um `AffiliateProfile` e registros na tabela `affiliates`. Quando uma venda é feita com indicação, o `affiliateId` fica cravado no pedido (`orders`), e através dele, rastreia-se o `user_id` (ID de autenticação) do afiliado.

## 2. O Fluxo de Vendas e Pagamentos (O Coração da Plataforma)
O motor de processamento está perfeitamente centralizado e robusto.

### A. A Chegada do Pagamento (Asaas Webhook)
O arquivo `src/app/api/webhooks/asaas/route.ts` é o guardião. 
Quando o Asaas dispara um `PAYMENT_CONFIRMED`, o webhook:
1. Valida o token de segurança.
2. Extrai o ID do Pedido (`orderId`) e a Taxa Asaas real.
3. Repassa a bola para o maestro financeiro: a função `updateOrderStatus()`.

### B. O Processamento e Comissionamento (`order-service.ts`)
A função `updateOrderStatus()` é onde toda a magia do comissionamento (Split) e liberação de acesso ocorre. Quando um pedido passa para `'paid'`:
1. **Idempotência:** Verifica se o pedido já não foi pago para evitar duplicação.
2. **Cálculo de Split:** Calcula o valor líquido do criador (`creatorNetAmount`) descontando as taxas da plataforma, a taxa Asaas e a comissão do afiliado (`affiliateCommissionAmount`).
3. **Carteira do Produtor:** Dispara o `recordWalletTransaction(type: 'SALE')` registrando o saldo líquido positivo no *ledger* da carteira do produtor.
4. **Carteira do Afiliado:** Se houver `affiliateId`, o sistema faz uma query na tabela `affiliates` para descobrir o `user_id` do afiliado, e dispara um `recordWalletTransaction(type: 'AFFILIATE_COMMISSION')` no nome dele.
5. **Liberação de Acesso:** Chama `grantStudentProductAccess()` (no `student-service.ts`) percorrendo todos os itens comprados e liberando o material no e-mail do aluno.

### C. Sistema de Notificações In-App
Atualmente, no próprio arquivo do webhook, logo após a venda ser confirmada com sucesso, o sistema dispara um `createNotification` in-app para o **Criador/Produtor** avisando "Nova venda: R$ XX,XX!".

---
### Conclusão Estratégica para E-mails (Resend)
O sistema está pronto e o código é extremamente limpo para plugar os e-mails transacionais.
Os "Ganchos" (Hooks) ideais para disparar os e-mails com a biblioteca da Resend são:

1. **E-mail de Acesso para o Aluno ("Seu material chegou!"):** Deve ser engatilhado no final da `updateOrderStatus()`, logo após o `grantStudentProductAccess()`, enviando para o `order.buyerEmail`.
2. **E-mail de Venda para o Produtor ("Ka-ching! Nova Venda!"):** Pode ser disparado lá no webhook, logo abaixo ou junto do `createNotification` in-app.
3. **E-mail de Comissão para o Afiliado ("Nova Comissão!"):** Deve ser disparado no bloco `if (order.affiliateId && affComission > 0)` da `updateOrderStatus()`, precisando apenas puxar o e-mail atrelado ao `affiliateUserId`.
