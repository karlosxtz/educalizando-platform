# Auditoria Rigorosa — Cálculo de Taxas da Plataforma (Pre-Carrinho)

## 1. Localização do Cálculo de Taxas e Split
Toda a inteligência financeira (o "motor de cálculo") está centralizada no arquivo `src/lib/order-service.ts`, especificamente na função `calculateOrderFinancials()`. 

É aqui que o sistema define a "Fonte Única da Verdade" para o comissionamento.

### Taxa por Produto (Fixa da Plataforma)
A taxa de R$ 0,99 por unidade é calculada dinamicamente com base na quantidade de itens no pedido:
```typescript
const productCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
const fixedFee = platformSettings ? Number(platformSettings.platform_fixed_fee) : 0.99;
const platformFixedFee = Number((productCount * fixedFee).toFixed(2));
```
Isso garante que se um aluno comprar 3 produtos no mesmo pedido, a plataforma desconte exatos `R$ 2,97` (3 x 0,99).

### Taxa por Transação (PIX / Asaas)
A taxa por transação financeira é calculada pela função auxiliar `estimateAsaasFee()`:
```typescript
export function estimateAsaasFee(paymentMethod: PaymentMethodType | string, amount: number): number {
  const method = (paymentMethod || 'pix').toString().toLowerCase();
  if (method === 'credit_card' || method === 'cartao') {
    return Number((0.49 + (amount * 0.0299)).toFixed(2));
  } else if (method === 'boleto') {
    return 1.99;
  } else {
    // Pix Asaas: R$ 1,99 por cobrança
    return 1.99;
  }
}
```
Isso garante que a taxa de `R$ 1,99` seja cobrada de forma fixa por cada pedido gerado, independente da quantidade de produtos dentro dele.

## 2. Como a Lógica Separa por Loja (Limitação do Carrinho)
Atualmente, o sistema **NÃO permite a mistura de lojas no mesmo pedido**. Na função `createOrderRecord()`, existe uma trava dura (Hard Stop) que proíbe compras multiplataforma num único checkout:

```typescript
// REGRA FUNDAMENTAL: Todos os produtos devem pertencer à mesma loja
const invalidItem = data.items.find(it => it.storeId !== data.storeId);
if (invalidItem) {
  throw new Error('Todos os produtos do pedido devem pertencer exclusivamente à mesma loja.');
}
```

### O Desafio para o Carrinho Unificado (Marketplace)
Como todo pedido (Order) tem uma coluna `store_id` única, as taxas e o gateway cobram os R$ 1,99 de PIX apenas do dono daquela loja específica.
Se implementarmos um Carrinho Unificado que permita colocar produtos da "Loja do Professor Carlos" e da "Loja da Professora Maria" juntos e gerar um único PIX (1 transação), teremos um **conflito financeiro**:
- O Gateway Asaas vai cobrar os `R$ 1,99` de quem? De Carlos ou de Maria? Ou vamos dividir R$ 1,00 para cada? 
- Como a tabela `orders` só suporta um `store_id`, o banco de dados atual não suportaria um checkout com múltiplos vendedores sem refatoração do esquema.

Para implementar o carrinho global de forma saudável sem explodir a estrutura do banco e das taxas, seria necessário utilizar um Split de Pagamento Multi-Vendor no Asaas ou limitar o carrinho por loja (ex: Amazon/Shopee onde o carrinho agrupa as compras por vendedor).
