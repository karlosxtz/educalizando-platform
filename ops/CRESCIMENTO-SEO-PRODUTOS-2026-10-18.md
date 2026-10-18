# Melhorias de cadastro, SEO e atribuição — 18/10/2026

## Implementado

- Editor guiado nos dois cadastros de produto: apresentação, conteúdo incluído, uso, público, formato e condições da licença. Ele reutiliza a descrição existente, não gera fatos e só aplica ao formulário mediante ação explícita. Se a descrição principal mudar durante a edição, a aplicação é bloqueada até recarregar o texto. Publicar continua dependendo de salvar o produto pelo fluxo atual.
- Apresentação pública compartilhada entre resumo de servidor e página interativa: seções, parágrafos e listas, sem HTML executável. Não há atualização em massa dos textos armazenados.
- Plano privado em `/dashboard/seo`, acessível em Meus Produtos e Métricas e anúncios. Prioridades baseadas no cadastro publicado da própria loja; filtros, até dez resultados e links de revisão. A nota usa a mesma função dos demais módulos e é identificada como nota interna. Galerias não totalmente carregadas são tratadas como itens a conferir, sem afirmar ausência. Visitas indisponíveis não viram zero.
- Gerador de links em Métricas e anúncios: UTM de origem, mídia e campanha, com domínio canônico fixo. Usa a captura existente, sem modificar checkout nem webhooks. Não gera UTMs de Google orgânico; marcar links manualmente não comprova busca orgânica.
- Consulta administrativa em Transações: pedidos criados na data selecionada e atualmente pagos, em horário de Brasília. Usa os parâmetros já persistidos e expõe somente sua classificação. Não retorna emails, documentos ou identificadores de clique. Sem parâmetros suficientes: origem não identificada. `fbclid` não é tratado como prova de anúncio. UTM google/organic é identificada como declaração do link, não confirmação independente. Sem coluna de atribuição, a consulta continua com aviso e origem desconhecida.
- Miniaturas na galeria do resumo público usam as prévias MinIO já geradas e verificadas, com fallback para o original. Capa principal e arquivos pagos permanecem no fluxo atual. Sem transformação paga, novo storage ou novo binding.

Não há migration. RLS, tenant, preços, compra, checkout, Asaas e webhooks permanecem intactos. Novas telas privadas herdam o noindex do dashboard/admin; API usa autenticação superadmin e `private, no-store`.

## Dez páginas observadas no Search Console

Fonte: painel autenticado, Pesquisa Web, 10 a 16/10/2026. Instantâneo consultado em 18/10; não é uma integração contínua ao Search Console. Ordenação por impressões. Não houve alteração nos dados dos criadores.

| Página | Cliques | Impressões | Próxima revisão |
| --- | ---: | ---: | --- |
| `/produto/kit-outubro-rosa-plaquinhas-para-fotos-e-conscientizacao` | 10 | 406 | Conferir intenção das consultas, prévias e informação do kit |
| `/produto/cabelo-maluco-carrinho-de-corrida-pdf-educacao-infantil-e-fundamental` | 4 | 394 | Investigar CTR por consulta/posição antes de propor novo título |
| `/produto/cabelo-maluco-unicornio-menina-pdf-educacao-infantil-e-ensino-fundamental` | 3 | 167 | Conferir termo pesquisado e representação da montagem nas imagens |
| `/produto/painel-consciencia-negra-pdf-9-partes-educacao-infantil-fundamental` | 3 | 111 | Diferenciar a proposta de outros painéis e detalhar componentes reais |
| `/produto/painel-consciencia-negra-pdf-32-paginas-educacao-infantil` | 2 | 74 | Conferir prévias e conteúdo incluído; relacionar a guias pertinentes |
| `/produto/historinha-e-lembrancinhas-12-de-outubro-dia-das-criancas-e-de-nossa-senhora-aparecida-pdf` | 2 | 68 | Considerar sazonalidade; preservar o cadastro e evitar alteração só pela data |
| `/produto/cartoes-dia-dos-professores` | 1 | 50 | Considerar sazonalidade e conferir modelos incluídos |
| `/produto/combo-mochila-maluca-ed-infantile-anos-inicais` | 0 | 49 | Conferir consultas e proposta do combo com o criador; não trocar slug automaticamente |
| `/` | 18 | 45 | Preservar marca, canonical e H1; acompanhar buscas de marca separadamente |
| `/produto/bambole-outubro-rosa-para-fotos-decoracao-e-conscientizacao` | 0 | 44 | Conferir resultado exibido pelo Google, posição e clareza das prévias |

Os totais do mesmo relatório eram 84 cliques, 2.550 impressões, CTR 3,3% e posição média 5,9. Melhorias de CTR exigem comparação por consulta/posição e período equivalente, considerando sazonalidade. Não se promete primeira posição.

## Arquivos alterados e motivos

| Arquivo | Motivo |
| --- | --- |
| `src/lib/product-description-sections.ts` | Compor e interpretar tópicos sem inferir informações |
| `src/components/dashboard/GuidedProductDescription.tsx` | Editor com prévia, cancelar e proteção contra sobrescrita |
| `src/app/dashboard/produtos/novo/ProductWizardStepOne.tsx` | Disponibilizar editor no cadastro principal |
| `src/components/dashboard/ProductWizardModal.tsx` | Disponibilizar editor no modal e permitir texto multilinha |
| `src/components/store/ProductDescriptionContent.tsx` | Renderização textual segura e organizada |
| `src/components/store/ProductPublicSummary.tsx` | Mesma descrição no servidor e miniaturas diretas do MinIO |
| `src/app/loja/[slug]/produto/[produtoSlug]/ProductDetailClientView.tsx` | Mesma descrição na experiência interativa |
| `src/lib/product-opportunities.ts` | Priorização por critérios reais, com isolamento por loja |
| `src/components/dashboard/ProductOpportunityReport.tsx` | Relatório filtrável e resumo sem novas queries |
| `src/app/dashboard/seo/page.tsx` | Página privada do plano de melhorias |
| `src/app/dashboard/produtos/page.tsx` | Mostrar resumo usando produtos já carregados |
| `src/app/dashboard/metricas-anuncios/page.tsx` | Acesso ao plano e gerador de links |
| `src/lib/campaign-link.ts` | Links canônicos com UTM validada |
| `src/components/dashboard/CampaignLinkBuilder.tsx` | Gerar e copiar links sem salvar configuração |
| `src/lib/order-origin.ts` | Classificação por evidência e intervalo de data |
| `src/app/api/admin/order-origins/route.ts` | Consulta privada, somente leitura e sem parâmetros brutos |
| `src/components/admin/OrderOriginsPanel.tsx` | Consulta manual por data, sem polling |
| `src/app/admin/transacoes/page.tsx` | Disponibilizar consulta sem modificar ações financeiras |
| `scripts/verify-product-growth.cjs` | Testes de preservação, XSS, tenant, classificação e autenticação |
| `package.json` | Comando `test:product-growth` |
| `ops/CRESCIMENTO-SEO-PRODUTOS-2026-10-18.md` | Escopo, oportunidades reais, validação e limites |

## Validação e dependências

Testes de crescimento, seleção pública/PLR, cache/imagens Cloudflare e limite de tamanho passaram. Lint sem erros (17 avisos preexistentes), typecheck e build de produção com empacotamento Wrangler foram executados. Prévia local testada sem salvar produtos: busca, estado vazio, preservar/cancelar tópicos, bloqueio após edição externa, aplicar ao formulário, listas públicas e copiar link. Editor e relatório conferidos em computador e celular.

Continuam dependendo de dados/autorização externos: conexão de leitura do Search Console/Analytics de cada loja, validação do evento purchase pelo pedido e revisão dos fatos pelo criador. Estes recursos não recuperam a origem de vendas anteriores sem rastreamento. Não foram criadas propriedades Google, habilitadas novas permissões nem enviadas mensagens a clientes. A aprovação Meta/Pinterest continua independente desta entrega.
