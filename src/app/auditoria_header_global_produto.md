# Auditoria Pós-Execução — Header e Footer na Rota Global (/produto/[id])

Concluí a inspeção estrutural na rota raiz `/produto/[id]/page.tsx` e em seus layouts pais. O diagnóstico revela que o componente está "isolado" da experiência visual do marketplace.

## 1. O Cenário Atual (Arquitetura)
- O arquivo `src/app/produto/[id]/page.tsx` está importando e renderizando o componente `ProductDetailClientView` de forma direta e solitária.
- Diferente da `Home` (`src/app/page.tsx`), que importa os componentes de vitrine explicitamente e os envelopa entre o `<MarketplaceHeader />` e o `<Footer />`, a rota de produto não faz isso.
- O arquivo `src/app/layout.tsx` (Root Layout) envelopa toda a aplicação com os *Providers* (ex: Carrinho) e Scripts, mas propositalmente não injeta Cabeçalho e Rodapé globais, pois outras rotas (como o Dashboard de Produtor ou o Checkout) exigem layouts completamente sem distrações.

## 2. A Fricção (O que o usuário vê)
Atualmente, quando um aluno clica em um material na vitrine e vai para `/produto/[id]`:
- Ele **NÃO VÊ** o cabeçalho principal do Marketplace (sem barra de pesquisa, sem botões de Login/Cadastro, sem Menu).
- Em vez disso, o componente `ProductDetailClientView` injeta seu próprio mini-cabeçalho (uma barra preta de segurança + um breadcrumb simples com o botão "Voltar").
- No final da página, ele vê o mini-rodapé da Loja, e **NÃO** o rodapé institucional e de SEO da Educalizando.

Isso causa uma quebra drástica de identidade. O usuário perde a sensação de estar dentro do shopping (Marketplace) e parece ter sido jogado em uma Landing Page isolada, sem conseguir navegar para buscar outras coisas se não quiser aquele produto.

## 3. Caminho Recomendado (Solução)
Para fixar essa quebra e integrar o produto perfeitamente ao marketplace, devemos **envelopar** a Client View.

Modificaremos o arquivo `src/app/produto/[id]/page.tsx` para importar os componentes globais e montá-los assim:
```tsx
import MarketplaceHeader from '@/components/MarketplaceHeader';
import Footer from '@/components/Footer';

// ... (fetch lógico)

return (
  <div className="flex flex-col min-h-screen">
    <MarketplaceHeader />
    <div className="flex-1">
      <ProductDetailClientView context="marketplace" ... />
    </div>
    <Footer />
  </div>
);
```
*(Nota: Para evitar redundância, precisaremos instruir o `ProductDetailClientView` a **esconder** seu mini-header e mini-footer quando a prop `context="marketplace"` for detectada, mantendo-os apenas para a rota de loja externa).*

A plataforma está pronta para receber essa injeção global. Qual a sua instrução de execução?
