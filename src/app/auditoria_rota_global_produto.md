# Auditoria Pós-Execução — Criação da Rota Global (/produto/[id])

## 1. O Problema Resolvido
Até o momento, todo o tráfego do Marketplace estava acoplado ao ecossistema particular de cada criador. Um aluno que navegava na vitrine global e clicava num produto era transportado para a rota `/loja/[slug]/produto/[id]`. Além de quebrar a fluidez e a sensação de estar dentro de uma única plataforma, o botão "Voltar" prendia o usuário na vitrine do professor, o que despencava as chances de *cross-selling* (vender outros produtos do Marketplace para a mesma pessoa).

## 2. A Engenharia de Solução (Desacoplamento Global)

Executamos uma alteração arquitetural limpa e precisa no Next.js para libertar o fluxo de vendas global:

### 2.1. A Rota Soberana: `src/app/produto/[id]/page.tsx`
- Criamos essa rota global na raiz da aplicação.
- Ela herda nativamente o `layout.tsx` principal. Isso significa que o cabeçalho oficial (`MarketplaceHeader`), o provedor de carrinho unificado e o `CartSidebar` operam naturalmente, sem o "sandbox" da loja.
- Reutilizamos a inteligência já existente para não haver código duplicado. A rota puxa o `getProductById` e implementamos a nova função `getStoreById` em `store-service.ts` para carregar a loja dona sem precisar do `slug`.

### 2.2. Inteligência de Contexto na View
- Não criamos outra view de produto. Usamos a exata mesma `ProductDetailClientView.tsx`.
- Injetamos a prop `context="marketplace"`.
- Graças a isso, a view agora decide inteligentemente:
  - **Contexto Marketplace:** O link de "Voltar" agora diz "Voltar para o Marketplace" e aponta exatamente para a Home (`/`).
  - **Contexto de Loja:** (quando o produtor envia seu link `loja/slug/produto/123`), o botão volta para a vitrine dele (`/loja/[slug]`), garantindo que ele não perca seu tráfego próprio.

### 2.3. Atualização dos Cards (`ProductCard.tsx`)
- Todos os componentes `ProductCard` (usados na Home, em listagens de Mais Vendidos, Categorias etc.) tiveram o destino final atualizado.
- O clique no card (imagem e título) não manda mais para `/loja/[slug]...`, e sim para `/produto/${product.id}`.

## 3. Conclusão e Estabilidade
- **Arquivos Criados:**
  - `src/app/produto/[id]/page.tsx` (Nova página)
- **Arquivos Modificados:**
  - `src/lib/store-service.ts` (Adição do `getStoreById`)
  - `src/app/loja/[slug]/produto/[id]/ProductDetailClientView.tsx` (Lógica de contexto para o header)
  - `src/components/ProductCard.tsx` (Atualização do link destino)
- **Status do Build:** Tipagem impecável. Sem quebras. A arquitetura suporta agora as duas estratégias de tráfego de forma elegante. Pronto para a Vercel compilar.
