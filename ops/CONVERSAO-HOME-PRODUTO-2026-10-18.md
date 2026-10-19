# Home e produto: imagens, banners e decisão de compra — 18/10/2026

## Diagnóstico observado

Produto informado: /produto/luva-pedagogica-assim-nasceu-jesus-historia-de-natal-em-pdf.
A capa e os quatro relacionados carregaram na reprodução. Não foi comprovada falha permanente de arquivo ou do MinIO. Os relacionados só iniciavam o carregamento próximo à rolagem e podiam apresentar espaços vazios durante a entrada. A galeria utilizava um componente diferente do resolvedor comum de imagens públicas, sem o mesmo fallback. O botão do marketplace herdava o rosa claro da loja, com baixo contraste. A compra no desktop estava depois de informações de entrega, amostra e cupom.

## Alterações

- Home com azul e violeta, texto em alto contraste, destaque fotográfico real clicável e botão sobre a foto.
- Dois banners com imagens reais do catálogo, links para gratuitos/ofertas e indicação de conferir condições de resgate.
- Superfícies coloridas entre as seções; nenhuma imagem gerada, biblioteca ou consulta adicional.
- Galeria usa CatalogImage com originais, normalização das URLs e fallback acessível; não fica invisível por uma transição de opacidade.
- Prévias deduplicadas após normalizar as URLs; miniaturas em faixa horizontal no celular.
- As quatro capas relacionadas são solicitadas antecipadamente, sem depender da chegada da rolagem. Essa exceção é limitada aos relacionados; o catálogo geral mantém lazy loading.
- Botões do marketplace usam azul escuro; as cores cadastradas nas lojas não foram alteradas.
- Painel de compra maior no desktop, botão logo abaixo do preço e barra fixa com contraste no celular.
- CTA adicional após o resumo móvel; todos os botões reutilizam os handlers existentes.
- Resumo HTML sem JavaScript mantém preço, imagem, descrição e link de compra.

## Arquivos e motivos

| Arquivo | Motivo |
| --- | --- |
| src/components/HomeBrandContent.tsx | Abertura colorida, imagem real clicável e botão fotográfico |
| src/components/HomeDiscoveryBanners.tsx | Banners de descoberta com imagens e CTAs |
| src/components/HomepageMarketplace.tsx | Integra os novos banners usando o catálogo já carregado |
| src/app/globals.css | Cores, contraste e superfícies de home/produto |
| src/app/loja/[slug]/produto/[produtoSlug]/ProductDetailClientView.tsx | Galeria normalizada e deduplicada, antecipação das quatro capas relacionadas, compra mais visível e apresentação móvel |
| src/components/store/ProductPublicSummary.tsx | Imagem com fallback e link de compra destacado no HTML inicial |
| scripts/verify-home-design.cjs | Executa os novos banners reais no teste da home |
| scripts/verify-minio-image-performance.cjs | Exercita preview com falha, fallback ao original exato e estado final acessível sem loop |
| scripts/verify-image-search-seo.cjs | Atualiza o carregador de teste para os componentes compartilhados de imagem/descrição |
| scripts/verify-product-seo-render.cjs | Mantém teste de compra e conteúdo reais no HTML sem JavaScript |
| ops/CONVERSAO-HOME-PRODUTO-2026-10-18.md | Diagnóstico, escopo e validação |

## Validação e limites

Na prévia local: clique na foto da home abriu produto no topo; preço e botão de compra visíveis no desktop; imagem principal e quatro relacionadas carregadas; troca de imagem da galeria funcionando. Em viewport móvel, largura útil 382px e scrollWidth 382px, botão fixo com 44px de altura e fundo rgb(9,59,108).

Testes de home, HTML de produto, imagens no SEO/sitemap, fallback de imagem, temas, conteúdo de produto e tamanho dos arquivos aprovados. Typecheck, lint e build de produção registrados em .cloudflare/conversion-*.log.

Nenhum dado cadastrado, preço, compra, RLS, webhook, checkout, acesso ou arquivo do MinIO foi alterado. Não foi feita compra nem disparado pagamento de teste. As imagens continuam diretas do MinIO, sem transformação ou tráfego de imagens pelo Worker.

A causa de desistências requer análise do funil e das ofertas; estas alterações não comprovam aumento de conversão nem garantem vendas. Falhas externas persistentes de rede/servidor de arquivos não podem ser eliminadas por um ajuste visual.
