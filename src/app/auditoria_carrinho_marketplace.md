# Auditoria Rigorosa — Rastreamento do Link do Carrinho (Marketplace)

## 1. Componentes da Página Principal (Header e Vitrine)
Ao auditar o componente principal de navegação do marketplace (`src/components/MarketplaceHeader.tsx`), identificamos exatamente de onde vem a origem do erro ao tentar acessar o carrinho de compras.

O componente possui dois pontos de acesso ao carrinho (um para mobile e um para desktop), e ambos estão hardcoded com o seguinte destino:
```tsx
<Link href="/carrinho" className="...">
  <ShoppingCart className="w-6 h-6" />
</Link>
```

## 2. Verificação de Rotas Dinâmicas (O Ponto de Falha)
A inspeção da estrutura de pastas da aplicação (`src/app/`) revela que **não existe nenhum diretório ou rota mapeada para `/carrinho`**. As pastas existentes cobrem rotas como `/aluno`, `/buscar`, `/cadastro`, `/dashboard`, `/entrar`, `/loja`, entre outras.

Como o Next.js não encontra a rota `/carrinho`, ele engatilha automaticamente o arquivo de fallback global de erro 404 (`src/app/not-found.tsx`).
Ao inspecionar o `not-found.tsx`, vemos exatamente a mensagem que o usuário relatou estar recebendo:
```tsx
<h1 className="text-2xl sm:text-3xl font-black text-slate-900">
  Página ou Material Não Encontrado
</h1>
```

### Conclusão do Diagnóstico
O botão do carrinho no cabeçalho do Marketplace está apontando para uma rota "fantasma" (`/carrinho`). Como a arquitetura atual do Educalizando é focada em checkout direto por produto na página da loja (via Checkout Asaas), um carrinho global do marketplace não foi implementado.

Para corrigir isso, temos dois caminhos:
1. **Ocultar o Carrinho Global:** Remover o ícone do carrinho no `MarketplaceHeader.tsx` já que as vendas acontecem diretamente nas páginas dos produtos individuais das lojas (`/loja/[slug]/produto/[id]`).
2. **Criar a Rota do Carrinho:** Implementar a página `/carrinho` que consuma o `cart-service.ts` para permitir compras de múltiplos itens na mesma transação.
