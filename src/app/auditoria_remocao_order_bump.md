# Auditoria Pós-Execução — Limpeza da Coluna de Compra (Remoção Order Bump)

Concluí a inspeção estrutural (Read-Only) da sidebar de conversão na coluna direita do componente `ProductDetailClientView.tsx`. Abaixo o diagnóstico exato para alcançar uma interface limpa, sem fricções e hiper focada na conversão.

## 1. Isolação do Bloco de Order Bump (O que remover)

Para extirpar a seção de Order Bump sem causar quebra na lógica de estado, precisaremos agir em três frentes:

**A. Remoção do Estado (Hook):**
Remover a declaração na linha `44`: 
`const [acceptOrderBump, setAcceptOrderBump] = useState(false);`

**B. Remoção da Lógica de Adição ao Carrinho:**
Dentro das funções `handleAddOnly` e `handleStartCheckout` (a partir da linha `124`), remover a estrutura condicional inteira que verifica e injeta o bump no carrinho:
```tsx
// REMOVER ESTE BLOCO NOS DOIS FLUXOS:
if (acceptOrderBump && product.order_bump_product) {
  addToCart({
    productId: product.order_bump_product.id,
    title: product.order_bump_product.titulo,
    price: product.order_bump_product.preco,
    // ...
  });
}
```

**C. Remoção do JSX (A Caixa Visível):**
No fluxo de renderização (linhas `446` a `479`), toda a div comentada como `{/* Order Bump Box */}` que encapsula `{product.order_bump_product && (...)}` deve ser apagada. O preço principal (`currentPrice`) não será afetado pois roda de forma independente.

## 2. Layout Minimalista: O Foco na Conversão (Referência Apple/Stripe)

Com a saída do Order Bump, a barra lateral de compra precisa ser "higienizada" para não parecer que algo sumiu, maximizando a urgência e o desejo de compra:

1. **Camuflagem do Cupom (Fator de Fuga):**
   - Atualmente, a caixa de "Possui um cupom?" é um enorme container `bg-slate-50`. Isso causa "fuga de carrinho" (o usuário abandona a página para procurar cupom no Google).
   - **Recomendação:** Substituir o form explícito por um texto sutil de link `"Adicionar Cupom"` que, apenas ao ser clicado, abre o input.
2. **Container Limpo (Card Elevado):**
   - Todo o container da direita deve abandonar as divisões e linhas duras (`border-b`, `border-t`). 
   - A borda forte deve ser substituída por um design de ilha flutuante limpa: `bg-white shadow-[0_10px_40px_rgb(0,0,0,0.06)] rounded-3xl p-6 sm:p-8`.
3. **Hierarquia de Botões:**
   - O botão `Comprar Agora` deve ser a joia da coroa (cor primária, sombra sutil, texto imponente). 
   - O botão `Adicionar ao Carrinho` (ação secundária) deve ser super discreto, como um `bg-slate-100 text-slate-600` sem borda.
4. **Espaçamento Respirável:**
   - Aumentar o `gap` entre o bloco de preço, os botões e os selos de confiança (Trust Features) para `space-y-6`.
   - O preço, gigantesco e negro (`text-slate-900 font-black`), flutuando livre de excesso de textos miúdos.

Com essas alterações, a Educalizando entrega um check-in elegante e altamente conversor. O código atual da página está preparado para essa limpeza? Qual o seu próximo comando?
