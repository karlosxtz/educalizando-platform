# Seis melhorias de descoberta, qualidade e pós-compra

## Onde encontrar

1. `/dashboard/seo#saude-materiais`: auditoria manual em lotes de 10 materiais da própria loja. Confere disponibilidade/tamanho da capa pública do MinIO e campos de apresentação. Timeout, redirecionamento, URL não permitida ou erro temporário são “não verificados”, nunca falha confirmada. Não baixa arquivos pagos nem a galeria inteira; não altera cadastros.
2. `/encontrar-material`: objetivo, etapa, idade e disciplina, com motivos visíveis da correspondência. Só usa produtos publicados e metadados reais. Idade ou ano não cadastrados não são inferidos. Os textos são correspondências no cadastro, não uma avaliação do arquivo nem garantia de adequação à turma.
3. `/comparar`: seleção de até três produtos/modalidades pelos cards e página do produto. Tabela de conteúdo, formato, páginas, público, licença e preço. Dados do produto final não são apresentados como dados da licença PLR. A seleção fica no navegador; o endereço da comparação é compartilhável e tem noindex.
4. `/cliente/dashboard`: busca de materiais autorizados entre lojas usando a mesma biblioteca existente. Abertura passa pelas rotas atuais de arquivos. Convite opcional e dispensável para avaliar usa somente compras pagas conferidas pelo servidor, exclui avaliações já feitas e a própria loja do criador. Até os 100 pedidos pagos mais recentes e até 100 produtos são considerados para o convite; não há envio de mensagens.
5. `/dashboard/metricas-anuncios`: prioridades com evidências do período e ações sugeridas. Limites mínimos evitam conclusões a partir de uma visita isolada. As sugestões são hipóteses e não atribuem causa ao checkout; não calculam uma conversão de coorte a partir de totais independentes.
6. `/dashboard/blog`: roteiro escrito pelo próprio criador, com objetivo, aplicação, adaptações e link de produto publicado da loja. Nada é publicado automaticamente. Artigos públicos exibem cards de produtos finais citados em links internos válidos, da loja autora quando houver autoria por loja. Referências PLR não viram recomendação de produto final.

Não requer nova migration. Não altera RLS, regras de acesso, checkout, preços, Asaas, webhooks ou arquivos de criadores.

## Arquivos alterados e motivo

| Arquivo | Motivo |
|---|---|
| `src/lib/material-health.ts` | Critérios de qualidade e HEAD com lista restrita de URLs, sem redirects. |
| `src/app/api/dashboard/material-health/route.ts` | Auditoria autenticada, filtro por loja proprietária, paginação e limite de concorrência. |
| `src/components/dashboard/MaterialHealthPanel.tsx` | Lotes, filtros, progresso e links de revisão. |
| `src/app/dashboard/seo/page.tsx` | Integrar saúde ao plano existente. |
| `src/lib/pedagogical-discovery.ts` | Correspondências explicáveis, critérios e recusa de idade/ano desconhecidos. |
| `src/lib/pedagogical-catalog.ts` | Consultar somente campos públicos e metadados do banco, com relação explícita da loja. |
| `src/app/encontrar-material/page.tsx` | Formulário e resultados por objetivo, com estados sem resultado e indisponível. |
| `src/lib/material-comparison.ts` | Validar seleção, limite e fatos distintos por modalidade. |
| `src/lib/comparison-client.ts` | Seleção local compartilhada e sincronizada entre abas. |
| `src/components/CompareProductButton.tsx` | Selecionar/remover material e avisar limite. |
| `src/components/ComparisonTray.tsx` | Acesso à tabela e limpeza da seleção. |
| `src/components/ComparisonRemoveButton.tsx` | Remover coluna e atualizar URL e seleção local. |
| `src/app/comparar/page.tsx` | Tabela pública que consulta só produtos publicados e modalidades disponíveis. |
| `src/components/ProductCard.tsx` | Seleção nos cards. |
| `src/components/MarketplaceHeader.tsx` | Acesso ao assistente e barra de comparação. |
| `src/app/loja/[slug]/produto/[produtoSlug]/ProductDetailClientView.tsx` | Comparar na página do material com a modalidade atual. |
| `src/components/aluno/PurchasedMaterialFinder.tsx` | Busca entre lojas, acesso aos arquivos existentes e convite dispensável. |
| `src/app/api/customer/review-opportunities/route.ts` | Conferir identidade, compras pagas e avaliações prévias sem aceitar ID de usuário do cliente. |
| `src/app/aluno/(protected)/dashboard/page.tsx` | Reutilizar uma única leitura da biblioteca para agrupamento e busca. |
| `src/lib/conversion-guidance.ts` | Critérios e linguagem das prioridades de conversão. |
| `src/components/dashboard/StoreConversionPanel.tsx` | Exibir prioridades e acesso à auditoria. |
| `src/lib/teaching-article.ts` | Organizar texto original e validar links internos de produtos. |
| `src/components/blog/TeachingArticlePlanner.tsx` | Roteiro preenchido manualmente com material da loja. |
| `src/components/blog/BlogRelatedMaterials.tsx` | Cards públicos de materiais citados, sem URLs de entrega. |
| `src/app/dashboard/blog/page.tsx` | Integrar roteiro e manter publicação manual existente. |
| `src/app/blog/[slug]/page.tsx` | Exibir materiais citados junto do artigo. |
| `src/app/privacidade/page.tsx` | Explicar armazenamento funcional da comparação e convite local. |
| `scripts/verify-six-improvements.cjs` | Testes de critérios reais, PLR, limite, SSRF, isolamento, pagamento e conteúdo original. |
| `ops/SEIS-MELHORIAS-PEDAGOGICAS-2026-10-19.md` | Documentar escopo e limites. |

## Validação técnica

Executados testes dedicados das seis melhorias e regressões de compradores, home, temas e seleção de produtos. Consulta anônima real dos campos pedagógicos validada sem chave administrativa. Lint integral, TypeScript Vinext e build de produção com validação Wrangler dry-run fazem parte da liberação.

## Conferência real após publicação

- Loja de revisão autenticada: auditoria concluiu o material disponível, confirmou capa de 31 KB e sugeriu prévia ausente. Não houve edição do cadastro.
- Assistente: busca por leitura no 1º ano retornou materiais; o filtro de 7 anos reconheceu a faixa cadastrada como “5 a 7”.
- Comparador: dois materiais selecionados, tabela com valores reais e campos ausentes identificados; remoção de coluna atualizou URL e seleção. A seleção de teste foi limpa.
- Blog: roteiro abriu e listou somente o produto da loja autenticada. Nenhum artigo foi salvo ou publicado durante a conferência.
- Métricas: painel carregou sem alerta de erro; prioridades só aparecem quando há sinais suficientes.
- Biblioteca: nova busca carregou o estado sem compras da conta de revisão. Não foi criada compra real, baixado arquivo pago ou publicada avaliação durante o teste. Autorização e convite por pedido pago cobertos pelos testes automatizados.
- Endpoints de auditoria e convite retornaram 401 em consultas sem autenticação.
