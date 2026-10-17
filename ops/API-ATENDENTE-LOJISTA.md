# API do atendente por loja — versão 1.1

Endpoint: `GET https://www.educalizando.com.br/api/integrations/store-chatbot`

Autenticação: `Authorization: Bearer SUA_CHAVE`. O cabeçalho alternativo `x-educalizando-api-key` continua aceito. Não coloque a chave na URL. A chave existente continua válida; nenhuma chave foi trocada nesta atualização.

## O que foi implementado

- Busca textual em título, descrição, categorias, níveis de ensino, temas e tags. Aceita acentos e palavras de ligação em português. Não pesquisa preços, códigos internos ou URLs como texto.
- Consulta direta de um material por UUID, sempre restrita à loja autenticada, publicado e não excluído.
- Filtros combináveis por categoria, nível de ensino, tema, data comemorativa, mês, formato, licença, gratuidade e faixa de preço.
- Ordenação por relevância, novidade e preço; paginação opcional e resposta compacta.
- Resumo do catálogo: categorias, níveis, temas, tags, tipos e datas, com contagem de produtos distintos.
- Datas comemorativas vinculadas aos temas efetivamente cadastrados. Datas móveis como Carnaval e Páscoa permanecem temas: a API não inventa um dia/mês.
- Sugestões opcionais por correspondência parcial, separadas dos resultados exatos e respeitando os filtros estruturados.
- Leitura do banco em lotes para evitar o corte silencioso de 1.000 registros; cobertura informada na resposta.
- Validação de parâmetros e erros com código estável e identificador de requisição.
- Respostas privadas sem cache, inclusive em erros, e limite de consultas com `Retry-After`.
- Consultas com sinal de cancelamento após 20 segundos; proteção também na espera da autenticação comercial e do limitador.
- Links de compra no domínio oficial, independentemente do domínio usado na requisição. URLs de mídia aceitam HTTPS e rejeitam credenciais embutidas.
- Preço inválido/ausente retorna `null`; a legenda orienta consultar a página do material. Não transforma ausência de preço em gratuidade.
- Relações de categorias limitadas às categorias globais ou da própria loja. Produtos de clubes e kits também vêm somente do catálogo publicado da loja.
- Atualização de último uso da chave não bloqueia uma consulta bem-sucedida quando a auditoria falha.

## Parâmetros

| Parâmetro | Valores / comportamento |
|---|---|
| `q` | Texto, até 120 caracteres. Todos os termos relevantes precisam corresponder. |
| `section` | `all` (padrão), `products`, `plr`, `free_materials`, `clubs`, `kits`, `facets`, `summary`. |
| `id` | UUID de produto. Não se aplica a clubes/kits/resumo. |
| `category` | Nome exato sem distinção de acentos/maiúsculas ou ID da categoria. |
| `educationLevel` | Nome exato normalizado ou ID do nível de ensino. |
| `theme` | Tema exato normalizado dos `seasonal_tags` cadastrados. |
| `date` | Nome ou slug de uma data reconhecida no calendário da plataforma. |
| `month` | Número de 1 a 12; considera apenas datas reconhecidas. |
| `type` | `pdf`, `ebook`, `video`, `curso`, `simulado`. |
| `license` | `standard` ou `plr`. `standard` também permite produtos que têm ambas as modalidades. |
| `free` | `true` ou `false`. Gratuidade é a marcação oficial do produto. |
| `minPrice`, `maxPrice` | Reais com ponto decimal, não negativos, até duas casas e máximo 1.000.000. Para `license=plr`, considera o preço PLR. |
| `sort` | `relevance` (padrão), `newest`, `price_asc`, `price_desc`. |
| `page` | 1 a 10.000; padrão 1. |
| `pageSize` | 1 a 100; padrão 20 quando a paginação está habilitada. |
| `view` | `full` (padrão) ou `compact`. A vista compacta também habilita paginação. |
| `includeFacets` | `true` adiciona o resumo de categorias/temas ao catálogo. |
| `suggestions` | `true` retorna até três sugestões parciais quando não há correspondência de produto. |

Parâmetros desconhecidos, repetidos ou inválidos retornam `400`. Filtros vazios de texto são ignorados. Booleanos aceitam somente `true`/`false`. Use codificação normal de URL para espaços e acentos.

## Exemplos para o atendente

```text
?section=facets
?section=products&q=alfabetizacao&pageSize=20
?section=all&category=Ci%C3%AAncias&educationLevel=Educa%C3%A7%C3%A3o%20Infantil&pageSize=20
?section=all&theme=Dia%20da%20%C3%81rvore&pageSize=20
?section=all&date=dia-da-arvore&month=9&pageSize=20
?section=plr&license=plr&maxPrice=50&sort=price_asc&pageSize=20
?section=free_materials&free=true&view=compact
?id=UUID_DO_PRODUTO
?q=leitura%20infantil&suggestions=true&pageSize=20
```

Para o cliente escolher uma opção já apresentada, consulte novamente por `id`, sem reutilizar o texto da busca anterior. Isso confirma o preço e a disponibilidade atuais. Se for compra PLR, consulte `section=plr&license=plr&id=UUID_DO_PRODUTO`. Use `plr.publicUrl` para revenda e `publicUrl` para a versão final.

## Contrato e compatibilidade

As listas e campos antigos continuam presentes nas seções correspondentes. Sem `page`, `pageSize` ou `view=compact`, a API conserva a resposta completa dentro do limite de leitura. Novos consumidores devem enviar `pageSize=20`.

`products` contém materiais não marcados como grátis; `freeMaterials` contém os grátis; `plrProducts` contém os habilitados para PLR. Um mesmo produto pode aparecer em duas listas por oferecer ambas as licenças. Deduplicate por `id` antes de apresentar opções. A paginação é independente em cada lista. `counts` informa o total filtrado carregado antes da paginação; `pagination` informa página, tamanho, total, páginas e `hasMore`.

`facetsScope=published-products-loaded-before-filters` significa que as contagens das facetas consideram os produtos carregados antes dos filtros, e não somente a página atual. Com `id`, consideram apenas o produto consultado. Em seções que não carregam clubes/kits, as contagens dessas listas ficam em zero; não representam o total global desses outros módulos.

`catalogCoverage` informa `loaded`, `total` e `truncated` por conjunto. O limite é de 5.000 itens publicados por conjunto para controlar tempo e memória. Se `truncated=true`, as buscas/facetas/contagens não cobrem registros além dessa janela. A consulta direta por `id` acessa qualquer produto publicado da loja, inclusive fora dela. Para lojas que ultrapassem esse limite, será necessário evoluir a pesquisa para indexação e filtros no banco; não foi criado um índice de busca remoto nesta atualização.

Os filtros herdados de categorias/níveis/temas em clubes e kits usam seus materiais publicados carregados. Licença PLR, formato e gratuidade são atributos de produtos; para esses filtros use as seções de materiais. Relações muito grandes que excedam o limite de leitura retornam indisponibilidade em vez de apresentar um resumo incompleto como se fosse completo.

Datas são referências recorrentes do calendário editorial existente (`dateKind=recurring-reference`), com `editorialStatus`. Não são uma lista oficial de feriados nem confirmação de calendário anual. Produtos sem categorias/temas cadastrados não recebem classificação inventada.

## Segurança e erros

| HTTP | `code` | Ação do atendente |
|---|---|---|
| 400 | `INVALID_QUERY` | Corrigir os parâmetros; não repetir a mesma consulta. |
| 401 | `INVALID_API_KEY` | Verificar credencial ativa; não pedir a chave ao cliente. |
| 403 | `INTEGRATION_SUSPENDED` | Verificar liberação do módulo no painel. |
| 404 | `STORE_NOT_FOUND` / `PRODUCT_NOT_FOUND` | Material/loja indisponível para essa chave. |
| 429 | `RATE_LIMITED` | Respeitar `Retry-After`. Limite atual: 120 consultas/minuto por identidade de rede. |
| 503 | `CATALOG_TIMEOUT` / `CATALOG_UNAVAILABLE` | Avisar indisponibilidade temporária e respeitar `Retry-After`. |

Toda resposta carrega `requestId` e cabeçalho `X-Request-ID`. Erros não expõem mensagens internas do banco, chaves ou dados de outra loja. A API não entrega arquivos pagos, pedidos ou informações dos clientes.

## n8n e validação

O fluxo simples baixado no painel agora solicita 20 itens e inclui as facetas. O rascunho de atendimento em `workflows/whatsapp-loja/educalizando-whatsapp-loja.json` foi atualizado para consultar a opção selecionada por ID e apresentar categorias, níveis e temas nos detalhes.

O rascunho continua inativo, sem credenciais e em modo de teste. A atualização da API não importa nem ativa o workflow no n8n e não envia mensagens de WhatsApp.

Testes executáveis:

```text
npm run test:store-chatbot-api
npx ts-node -P tsconfig.test.json scripts/verify-store-chatbot-query.ts
node scripts/verify-store-chatbot-route.mjs
node workflows/whatsapp-loja/test.mjs
```

As consultas autorizadas são testadas com banco simulado, incluindo duas lojas, rascunhos, excluídos, chave revogada, suspensão, limite de chamadas e catálogo com 5.001 itens. O teste não lê dados reais de compradores nem envia mensagens. A checagem TypeScript global possui erros preexistentes nos arquivos gerados de `.next`; os testes específicos, lint dos arquivos alterados e build devem ser considerados separadamente.

### Publicação e resultados

Publicado no Worker `educalizando-app`, versão `6de42575-8ac0-4598-bdbd-206586e400e1`. Build de produção e lint dos arquivos da API passaram. Os testes de consulta, endpoint e rascunho n8n passaram, incluindo cancelamento por tempo excedido, preço PLR ausente e categoria privada de outra loja. O comando `npm run test:store-chatbot-api` agora incorpora os testes novos de filtros e endpoint à verificação habitual.

A verificação real (`node scripts/verify-store-chatbot-live.mjs`) confirmou HTTP 401 com `INVALID_API_KEY` e `requestId` para credencial ausente/inválida, resposta sem cache e homepage/login disponíveis. Não foi feita consulta autenticada real com chave de lojista; essa parte foi validada com backend simulado. As credenciais existentes foram preservadas e o workflow não foi ativado.
