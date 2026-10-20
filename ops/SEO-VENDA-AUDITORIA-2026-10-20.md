# SEO e venda de 20/10/2026

## Venda verificada no painel administrativo

O relatório Origem das vendas de 20/10 mostrou um pedido pago da loja Baú do
professor, R$ 5,99, criado às 07:30:01 e confirmado às 07:32:45 (Brasília).
A classificação é Origem não identificada. Não havia parâmetros suficientes no
pedido para atribuir a compra ao Google, anúncios ou outro canal.

No GA4 Educalizando - site e vendas (propriedade 559484516), o filtro Hoje mostrou
3 sessões, todas classificadas como Organic Search, e receita total R$ 0,00 no
momento da consulta. Isso não comprova a origem da compra nem ausência de venda:
o pedido pago foi confirmado no sistema, e não havia atribuição de compra
disponível nesse relatório. A medição depende do consentimento e do processamento
do Google. Nenhuma compra fictícia foi disparada.

## Search Console

Comparação exibida pelo Google: últimos 7 dias x 7 dias anteriores, consulta em
20/10. São dados do relatório, não uma medição instantânea das alterações do site.

| Métrica | Últimos 7 dias | 7 dias anteriores |
| --- | --- | --- |
| Cliques | 85 | 83 |
| Impressões | 2,54 mil | 2,75 mil |
| CTR | 3,4% | 3,0% |
| Posição média | 6,2 | 6,1 |

O resultado é misto: cliques e CTR cresceram; impressões caíram e a posição média
piorou ligeiramente. Não é possível atribuir essas oscilações apenas às mudanças
técnicas, considerando sazonalidade e outros fatores.

Na visão geral consultada: 441 páginas indexadas, 324 não indexadas; 22 entidades
válidas de produto e 22 de listagens do comerciante, zero inválidas nessas duas
categorias. Sem dados suficientes de Core Web Vitals nessa visão geral. Contagens
de indexação têm defasagem e não equivalem ao tamanho do catálogo publicado hoje.

## Auditoria técnica pública

424 URLs verificadas pelo sitemap atual e rotas complementares, com duas consultas
simultâneas. Zero falhas nas checagens do script: HTTP, metadados básicos,
canonical, exclusão de páginas de acesso e contratos de dados estruturados.
O sitemap atual é um urlset direto, não um índice de outros sitemaps.

Houve 32 páginas com avisos, majoritariamente títulos longos. Existem casos com
centenas de caracteres, incluindo um título de 1.025 caracteres. Esses registros
precisam de revisão editorial do criador, separando nome do material e descrição.
Não foram alterados nomes, slugs ou produtos publicados automaticamente.

Um produto foi sinalizado sem imagem pública no schema:
`/produto/caixa-piramide-dia-das-criancas`. Requer conferir a capa cadastrada.
O aviso de dois H1 no HTML bruto da home envolve o fallback do streaming e não
prova dois H1 visíveis após a renderização. Nenhum elemento foi removido por esse
resultado isolado. O script não certifica Rich Results nem posição no Google.

Robots respondeu corretamente, mantendo áreas privadas bloqueadas. Os três hosts
alternativos consultados redirecionaram ao domínio canônico HTTPS com www.
O relatório bruto local está em `.cloudflare/seo-audit-2026-10-20.json`.

## Melhorias implementadas e arquivos

- `src/lib/platform-analytics.ts`: inclui as páginas públicas novas de ofertas,
  calendário, glossário, etapas, busca por objetivo, comparador e combos na lista
  de medição opcional. Não inclui conteúdo de filtros, objetivos digitados ou
  parâmetros privados nas URLs enviadas. Áreas privadas continuam excluídas.
- `scripts/verify-platform-analytics.cjs`: testa as páginas novas, aceite, recusa e
  remoção dos parâmetros privados, junto às regressões existentes de compras.
- `scripts/audit-seo-general.mjs`: aceita tanto sitemapindex quanto urlset direto,
  valida o domínio e permite escolher o arquivo do relatório por variável local.
- Este relatório: evidências da venda, métricas, escopo e limites da auditoria.

Testes de Analytics passaram. A cobertura adicional só vale para visitas futuras
consentidas; não recupera a origem da compra já registrada. Não se alteram checkout,
webhooks, preços, políticas, dados de compradores ou regras de consentimento.

Lint sem erros (14 avisos preexistentes), TypeScript e build de produção aprovados.
