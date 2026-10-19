# Destaques rotativos e materiais gratuitos na home

Corrigido o recorte da home: os gratuitos eram filtrados apenas entre os 100 produtos mais recentes. A consulta pública independente encontrou **6 gratuitos publicados, de 3 lojas**. A home agora recebe esse conjunto separado e exibe todos os gratuitos retornados, incluindo os mais antigos, sem modificar o cadastro ou as condições de resgate.

Os três espaços (arte principal, gratuitos e ofertas) usam seleção por loja antes de escolher o produto. Quando possível, usam lojas e produtos diferentes entre si e evitam os produtos da seleção anterior. A arte de gratuitos só usa material gratuito; a de ofertas só usa promoções reais. A seleção inicial preserva SSR/hidratação e é sorteada no visitante após um segundo, com nova seleção a cada 12 segundos. A troca para enquanto o ponteiro ou foco está na área, com aba oculta, e não se repete automaticamente para quem prefere movimento reduzido. Não há polling, chamadas adicionais durante as trocas ou serviço de imagem novo. A lista geral de candidatos foi ampliada de 100 para 1000 produtos publicados; nenhum item ganha prioridade por ter maior catálogo. Não é uma garantia de impressões iguais, pois as seleções são aleatórias e cada arte tem seus próprios critérios.

## Verificação

Lint sem erros (17 avisos preexistentes), typecheck, teste de renderização/seleção da home e build real Vinext/Wrangler passaram. Testes cobrem gratuito antigo fora da lista principal, múltiplos gratuitos, diversidade entre lojas, sorteio por loja independentemente do tamanho do catálogo, prevenção de repetição quando há alternativas e estado vazio. Consulta de produção somente leitura confirmou os seis materiais; nenhum registro de criador foi alterado. Revisão visual por navegador indisponível nesta etapa por configuração do Work.

## Arquivos alterados

| Arquivo | Motivo |
| --- | --- |
| `src/app/page.tsx` | Consulta independente de gratuitos e conjunto maior de candidatos. |
| `src/lib/product-read-service.ts` | Projeção pública compacta opcional para consulta de gratuitos, mantendo comportamento anterior dos demais consumidores. |
| `src/components/HomepageMarketplace.tsx` | Usar gratuitos completos, deduplicar IDs e integrar os destaques. |
| `src/lib/home-highlight-selection.ts` | Sorteio por loja, critérios de cada arte e diversidade. |
| `src/components/HomeRotatingHighlights.tsx` | Trocar os três destaques no visitante sem novas requisições ao banco. |
| `scripts/verify-home-design.cjs` | Regressão dos gratuitos e critérios de seleção. |
| `ops/HOME-DESTAQUES-GRATUITOS-2026-10-19.md` | Registrar causa, solução, limites e verificações. |
