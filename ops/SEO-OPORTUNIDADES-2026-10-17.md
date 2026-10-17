# SEO por oportunidades reais — 17/10/2026

## Dados observados

Leitura autenticada do Google Search Console, propriedade de domínio
`educalizando.com.br`, pesquisa Web. Comparação selecionada: últimos 28 dias
versus 28 dias anteriores. O relatório é uma fotografia do painel, não uma
previsão de crescimento. Foram lidas 261 consultas e 269 páginas.

| Métrica | Últimos 28 dias | 28 dias anteriores |
|---|---:|---:|
| Cliques | 200 | 8 |
| Impressões | 4.628 | 69 |
| CTR | 4,3% | 11,6% |
| Posição média | 6,3 | 10,3 |

Filtro de marca `educalizando|educaizando`: 88 cliques, 106 impressões,
83% de CTR e posição média 1. Filtro que não corresponde à expressão:
25 cliques, 1.698 impressões, 1,5% de CTR e posição média 7,7.
Os filtros são parciais por privacidade: os outros 87 cliques não podem ser
classificados como marca/não marca com estes dados. Não subtrair 88 de 200
e apresentar o resultado como tráfego não relacionado à marca.

Celular: 81 cliques, 3.219 impressões, CTR 2,5% e posição 6,2.
A queda da CTR total coincide com uma ampliação muito grande das impressões;
não demonstra sozinha regressão de SEO nem identifica sua causa.

## Prioridades encontradas

| Página de produto | Impressões | Cliques | CTR | Posição média |
|---|---:|---:|---:|---:|
| Cabelo Maluco — Carrinho de Corrida | 726 | 5 | 0,7% | 5 |
| Cabelo Maluco — Unicórnio Menina | 513 | 8 | 1,6% | 5,5 |
| Kit Lembrancinhas Dia das Crianças com Doces | 447 | 10 | 2,2% | 7,3 |
| Painel Desfile Maluco | 248 | 10 | 4% | 4,8 |
| Kit Outubro Rosa — Plaquinhas | 230 | 5 | 2,2% | 4,2 |

Dados estruturados e demais prioridades:
[seo-oportunidades-2026-10-17.json](seo-oportunidades-2026-10-17.json).
As páginas sazonais de outubro têm procura ligada à época; não projetar esses
volumes para o restante do ano. Não foram criadas novas páginas em massa.

## Alterações

1. Resumo de pesquisa do produto passa a aproveitar a descrição cadastrada,
   em vez de repetir o título inteiro e deixar pouco espaço para o conteúdo.
   PDF e quantidade de páginas entram somente quando cadastrados e ainda não
   mencionados. A versão PLR não herda essas características da versão final.
   Metadados HTML, Open Graph e Twitter recebem o mesmo resumo.
2. Nome completo do produto continua preservado no título. Falta de descrição
   não é autorização para inventar conteúdo. Referências de desambiguação e
   canonical único continuam funcionando.
3. HTML inicial preserva parágrafos e listas de descrições importadas, com
   remoção de scripts e renderização escapada pelo React.
4. Links de loja, categoria, níveis e materiais relacionados passam a existir
   no HTML do servidor e permanecem após o carregamento da interface interativa.
   Reutilizam dados já carregados, sem novas consultas. Categorias próprias
   da loja continuam levando ao filtro da própria loja.
5. Título de `/atividades-para-imprimir` deixa de sugerir um acervo inteiro
   gratuito. O resumo apresenta tema, etapa, prévias, formatos e preços.
6. Duas páginas existentes do calendário recebem orientações distintas e
   detalhadas: Proclamação da República e Consciência Negra. São sugestões de
   planejamento, sem afirmar que os produtos incluam recursos não cadastrados.
7. Oito páginas editoriais existentes entram no cache público de HTML por uma
   hora, com a mesma revisão/invalidação do catálogo. Cookies, autorização,
   parâmetros, navegação RSC, erros e áreas privadas continuam fora do cache.
   Usa os bindings existentes; não há novo KV, R2 ou serviço de imagens.
8. Três URLs antigas recebem 301 antes da renderização. Somente correspondências
   explícitas conferidas em produção são usadas; não há associação aproximada
   automática. Parâmetros de licença e campanha são preservados.

| URL antiga em `/produto/` | Destino atual | ID confirmado |
|---|---|---|
| arte-primavera-y66a | arte-primavera | f39e3e16-2d8f-4149-99d8-70b982c68a9e |
| caixa-das-frases-40-frases-em-letra-cursiva-e-letra-bastao-62ce | caixa-das-frases-40-frases-em-letra-cursiva-e-letra-bastao | 5671b60e-9307-4a77-9b30-b36af8b357b0 |
| lap-book-interativo-renascimento | lap-book-interativo-renascimento-7-ano | 8261ebfe-36cb-41f1-8cae-7cb95bae11ca |

## Indexação e desempenho

Search Console: 441 páginas indexadas e 324 não indexadas. Motivos: 194 noindex,
13 alternativas com canonical, 7 redirecionamentos, 3 cópias sem canonical,
1 404, 1 bloqueada por robots, 20 rastreadas não indexadas e 85 detectadas não
indexadas. Os relatórios têm atraso; nem todos esses números representam falhas.

Os 20 exemplos de rastreadas incluem favicon, manifest, URLs antigas de imagem,
buscas filtradas, versão PLR e uma loja sem produtos. Esses exemplos não precisam
todos virar páginas indexadas. Produtos canônicos e páginas editoriais relevantes
são o foco. Não foi clicado em validar correção para afirmar que uma decisão de
indexação do Google estaria resolvida apenas pela alteração no código.

Snippets de produtos e listagens do comerciante: 19 válidos e zero inválidos
em cada relatório. Breadcrumbs: 44 válidos e zero inválidos.
Core Web Vitals: sem dados suficientes no Search Console para ambos os dispositivos.

Amostra HTTP inicial: 59 URLs do relatório e páginas de entrada. Três URLs
antigas retornavam 404 e motivaram as regras acima. As páginas canônicas de
produto verificadas têm Product/Offer e canonical. Uma URL UUID responde com
redirecionamento durante o streaming do framework e aponta ao slug canônico;
isso é distinto de uma página canônica sem conteúdo. Não foi renomeado esse
produto nem criado um endereço curto fictício.

Verificação móvel da home: viewport de 390px, largura de conteúdo igual à
largura disponível (382px descontando a barra), uma H1 e a capa visível carregada
diretamente do MinIO. Não equivale a uma medição de LCP/INP/CLS.
O endpoint público do PageSpeed retornou HTTP 429 por cota do serviço. A interface
pública concluiu uma análise separada: desempenho 66, acessibilidade 95, práticas
recomendadas 92 e SEO 100; FCP 3,0s, LCP 5,1s, TBT 50ms e CLS 0,18.
Teste de laboratório em Moto G Power emulado/4G lento, não dados de campo.
[Relatório inicial do Google](https://pagespeed.web.dev/analysis/https-www-educalizando-com-br/ik0h2zatl0?form_factor=mobile).

O relatório identificou a introdução da home como elemento deslocado e como LCP.
O cabeçalho inteiro era suspenso por `useSearchParams`, substituindo um placeholder
de 73px por um menu maior após a hidratação. O cabeçalho agora existe no HTML
inicial; apenas a atualização visual dos filtros usa uma pequena fronteira
Suspense sem conteúdo. O teste simula parâmetros suspensos e confirma que busca,
logo e navegação continuam renderizados no servidor.

A logo PNG principal tinha 1.073.995 bytes (2172x724). Foi criada uma cópia WebP
504x168 de 29.838 bytes, enviada ao MinIO e verificada com HEAD 200, image/webp,
tamanho correto e cache imutável. Cabeçalho e rodapé públicos usam essa cópia;
originais permanecem intactos. A redução do arquivo é de aproximadamente 97%.
As capas da prateleira abaixo da introdução deixam de ter prioridade alta para
não competir com o texto principal. Os títulos do rodapé passam de H4 para H3,
evitando pular um nível após as seções H2.

## Verificação e acompanhamento

Testes cobrem resumos, PLR, nomes completos, canonical compartilhado, avaliações
reais, HTML sem JavaScript, proteção MinIO, redirecionamentos e isolamento de cache.
Lint, typecheck e build de produção são executados antes da publicação.

Após publicação, conferir 301 e destinos, novos metadados e links no HTML,
sitemap, robots e cache das páginas editoriais. Aguardar novos rastreamentos
para comparar CTR e posição. O Google pode substituir o título/resumo exibido;
nenhuma nota interna ou alteração técnica garante primeiro lugar.

Referências oficiais: [resumos](https://developers.google.com/search/docs/appearance/snippet),
[títulos](https://developers.google.com/search/docs/appearance/title-link).

## Arquivos alterados e motivo

| Arquivo | Motivo |
|---|---|
| src/lib/catalog-seo.ts | Resumos baseados nos campos reais, sem repetir título inteiro. |
| src/lib/page-seo.ts | Apresentação precisa da página de atividades para imprimir. |
| src/components/store/ProductPublicSummary.tsx | Parágrafos legíveis no HTML inicial. |
| src/components/store/ProductDiscoveryLinks.tsx | Links internos acessíveis antes e depois da hidratação. |
| src/app/produto/[slug]/page.tsx | Integrar descoberta à página canônica. |
| src/app/loja/[slug]/produto/[produtoSlug]/page.tsx | Integrar descoberta preservando o contexto da loja. |
| src/lib/calendar-editorial.ts | Conteúdo útil e próprio de duas datas. |
| src/components/seo/CalendarPlanningContent.tsx | Renderizar orientações e links no servidor. |
| src/app/calendario/[slug]/page.tsx | Integrar textos e metadados das datas existentes. |
| src/lib/legacy-product-urls.ts | Mapeamento explícito das três URLs antigas. |
| cloudflare/worker.js | Aplicar 301 antes do cache e da renderização. |
| cloudflare/public-page-cache.js | Cache das oito páginas editoriais públicas. |
| next.config.ts | Marcar apenas essas páginas como documentos públicos elegíveis. |
| scripts/verify-search-opportunities.cjs | Regressão dos resumos, links e 301. |
| scripts/verify-public-page-cache.mjs | Cache, invalidação e bypass das páginas editoriais. |
| scripts/verify-catalog-seo.ts | Atualizar contrato do resumo PLR. |
| scripts/verify-seo-quality.cjs | Nome intacto no título e resumo útil separado. |
| scripts/verify-product-seo-render.cjs | Cobrir o novo formatador de texto no SSR. |
| ops/seo-oportunidades-2026-10-17.json | Evidência agregada e prioridades observadas. |
| ops/SEO-OPORTUNIDADES-2026-10-17.md | Relatório, limites e inventário de alterações. |
| ops/MINIO-IMAGENS-2026-10-17.md | Registrar a correção de cache concluída na etapa anterior. |
| src/components/MarketplaceHeader.tsx | Cabeçalho completo no SSR e logo leve. |
| src/components/Footer.tsx | Logo leve com dimensões corretas e hierarquia H3. |
| src/components/HomepageMarketplace.tsx | Tirar prioridade alta das capas abaixo da dobra. |
| src/lib/brand-assets.ts | URL pública verificada da logo compacta no MinIO. |
