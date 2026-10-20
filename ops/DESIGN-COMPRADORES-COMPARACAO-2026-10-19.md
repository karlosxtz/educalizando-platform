# Busca, comparação, compra e biblioteca — 19/10/2026

## Alterações

- `src/app/encontrar-material/page.tsx`: apresentação mais clara da busca por objetivo, exemplos de temas, filtros opcionais e explicação recolhível dos critérios. Algoritmo e dados de correspondência preservados.
- `src/app/comparar/page.tsx`: capas, modalidade e preço no início de cada coluna; critérios curtos antes do conteúdo; resumo expansível para descrições extensas; estado vazio com acesso ao catálogo. Mesmas consultas, limites e distinção PLR/produto final.
- `src/components/ComparisonTray.tsx`: barra menor e arredondada, sem sobrepor a própria tela de comparação. Mesma seleção local e limite de três materiais.
- `src/components/ComparisonRemoveButton.tsx`: ação visual mais discreta, mantendo a atualização da seleção e do endereço.
- `src/components/store/PurchaseRail.tsx` (novo): mede a altura efetiva do cabeçalho do marketplace com ResizeObserver e posiciona o cartão de compra abaixo dele. Atualiza ao mudar a largura ou altura do cabeçalho; libera os observadores ao desmontar.
- `src/components/store/PurchaseRail.module.css` (novo): enquadramento do cartão na altura disponível do desktop, rolagem própria quando o conteúdo excede essa altura, largura mínima e campos protegidos contra transbordamento. No celular, usa fluxo normal da página.
- `src/app/loja/[slug]/produto/[produtoSlug]/ProductDetailClientView.tsx`: usa PurchaseRail no lugar do sticky com distância fixa. Eventos de compra e cupom intactos.
- `src/app/loja/[slug]/kit/[id]/KitDetailClientView.tsx`: mesmo padrão do cartão de preço em combos, incluindo os exibidos no marketplace. Preços, checkout e botões preservados.
- `src/components/aluno/StudentHeader.tsx`: navegação unificada em uma linha de atalhos rolável no celular; todos os destinos anteriores mantidos; página atual destacada. Conta e saída preservadas.
- `src/app/aluno/(protected)/dashboard/page.tsx`: cabeçalho de boas-vindas, atalhos de planejamento/favoritos/busca e coleções por loja. Mesmos serviços de sessão e compras, agrupamento e inclusão de materiais exclusivos.
- `src/components/aluno/PurchasedMaterialFinder.tsx`: biblioteca com capas e cartões de acesso; filtros exibidos quando há materiais; estado vazio com orientação útil; avaliação continua opcional e condicionada a compra verificada.
- `src/components/teaching/CommerceExperience.module.css` (novo): estilos restritos a estas áreas, fundos suaves, botões arredondados, tabela de comparação sem bordas pesadas, biblioteca e navegação responsivas.
- Este documento: arquivos, motivos, validação e limites.

Sem migration. Sem alteração de RLS, isolamento, pedidos, checkout, Asaas ou webhooks. Nenhum serviço externo de imagem ou dado de demonstração inserido.

## Verificação

Lint completo, typecheck Vinext, build de produção + Wrangler dry-run. Regressões: `verify-six-improvements.cjs`, `verify-buyer-growth.cjs`, `verify-teaching-workspace.cjs` e `verify-store-themes.cjs`. Logs locais ignorados em `.cloudflare/commerce-premium-*.log`.
