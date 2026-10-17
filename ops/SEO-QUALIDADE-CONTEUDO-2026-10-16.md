# Qualidade do conteúdo indexável — 16/10/2026

Auditoria de dados públicos em 2026-10-17T02:26:59.495Z. Nenhum registro de loja, produto ou categoria foi alterado. Sem migration, alteração de RLS, preços, checkout, Asaas ou webhooks. Sem criação de páginas em massa.

## Sitemap

De **672** para **378 URLs**: 294 URLs da auditoria anterior removidas; 0 adicionadas pela evolução do catálogo. A lista completa de caminhos e motivos está em seo-qualidade-2026-10-16.json.

| Motivo | URLs removidas |
| --- | --- |
| produto alternativo: canonical global único | 264 |
| sem produtos publicados | 10 |
| mudança no catálogo público desde a auditoria anterior | 2 |
| menos de 3 produtos publicados | 14 |
| canonical consolidado | 1 |
| categoria genérica | 3 |

## Critérios automáticos

- Contagem: Produtos próprios publicados/ativos, não excluídos, visíveis sob RLS pública. Cada produto conta uma vez por slug de categoria; afiliados não multiplicam o catálogo.
- Loja com zero produtos: noindex, follow e fora do sitemap; volta após publicação do primeiro produto, na próxima revalidação pública (cache de catálogo: 300 segundos; cache de página/CDN pode acrescentar tempo).
- Duplicidade de loja: nome igual após normalizar acentos/pontuação, slug com no máximo um erro de caractere (mínimo oito caracteres), ou sufixo gerado de quatro caracteres. Só a de contagem estritamente menor recebe noindex. Empates aguardam decisão do proprietário. Não se presume duplicidade apenas por palavras genéricas em comum.
- Categorias: contagem por URL/slug, reunindo todos os IDs globais com aquele slug e sem contar um produto duas vezes. Menos de três produtos: noindex, follow e fora do sitemap. Outros, Outros Conteúdos e Combo: sempre noindex, independentemente da contagem.
- Aliases semânticos conhecidos apontam canonical para a categoria principal; a principal exibe materiais de todos os IDs do grupo. Alias com três ou mais produtos mantém index, follow com canonical principal; alias fino recebe noindex, follow conforme solicitado. Só a URL principal elegível entra no sitemap. Os limiares usam a contagem própria do slug.
- Falha na consulta não é tratada como catálogo vazio. Lojas afiliadas continuam funcionando: esta política altera apenas indexação, sem remover vitrines ou vínculos.

## Lojas vazias

| Loja | Slug | Produtos |
| --- | --- | --- |
| Baú Pedagógico | bau-pedagogico | 0 |
| Oficina Lúdica Ciências | oficina-ludica-ciencias | 0 |
| pedagogiali | pedagogogiali | 0 |
| Recursos criativos7 | recursos-criativos7 | 0 |
| DOCE APRENDER PEDAGOGICO PLR | doce-aprender-pedagogico-plr | 0 |
| Hyper Light | hyper-light | 0 |
| Saber Mais Recursos Pedagógicos | saber-mais-recursos-pedagogicos | 0 |
| ATIVIDADE CRIATIVA | atividade-criativa | 0 |
| Educação Lúdica | educacao-ludica-nzur | 0 |
| Layla Martins Atividades Pedagógicas | layla-martins-atividades-pedagogicas | 0 |

## Pares de lojas duplicadas

Nenhum par encontrado pelos critérios acima. Nenhuma loja foi apagada, renomeada ou fundida. A lista de todas as lojas e suas contagens está no JSON para revisão manual.

## Categorias consolidadas

| Alias | Produtos próprios | Canonical principal | Produtos distintos do grupo |
| --- | --- | --- | --- |
| outros-conteudos | 3 | outros | 11 |
| religioso | 3 | ensino-religioso | 5 |
| ciencia-e-biologia | 1 | ciencias-biologia | 6 |

## Categorias com menos de três produtos

| Categoria | Slug | Produtos |
| --- | --- | --- |
| Bíblia e Histórias Bíblicas | biblia-historias-biblicas | 2 |
| Catequese | catequese | 2 |
| Educação Financeira | educacao-financeira | 2 |
| Psicopedagogia | psicopedagogia | 2 |
| Caligrafia | caligrafia | 1 |
| Ciência e Biologia | ciencia-e-biologia | 1 |
| Geografia | geografia | 1 |
| História & Geografia | historia-geografia | 1 |
| Inclusão e Acessibilidade | inclusao-acessibilidade | 1 |
| Material adaptado | material-adaptado | 1 |
| Música | musica | 1 |
| Planners e Organização | planners-e-organizacao | 1 |
| Português & Literatura | portugues-literatura | 1 |
| Vestibular & ENEM | vestibular-enem | 1 |
| Concursos Públicos | concursos-publicos | 0 |
| Educação Física | educacao-fisica | 0 |
| Física & Química | fisica-quimica | 0 |
| Formação de Professores | formacao-de-professores | 0 |
| Gestão Escolar | gestao-escolar | 0 |
| Idiomas & Inglês | idiomas-ingles | 0 |
| Inglês | ingles | 0 |
| Libras | libras | 0 |
| Meio Ambiente e Sustentabilidade | meio-ambiente-sustentabilidade | 0 |
| Planos de Aula | planos-de-aula | 0 |
| Projetos e Sequências Didáticas | projetos-sequencias-didaticas | 0 |
| Raciocínio Lógico | raciocinio-logico | 0 |
| Redação 1000 | redacao-1000 | 0 |
| Redação e Produção Textual | redacao-producao-textual | 0 |
| Robótica e Programação | robotica-programacao | 0 |
| Tecnologia e Informática | tecnologia-informatica | 0 |

## Registros com o mesmo slug

| Slug | Registros | Produtos distintos da URL |
| --- | --- | --- |
| idiomas-ingles | 3 | 0 |
| vestibular-enem | 3 | 1 |
| ciencias-biologia | 3 | 6 |
| educacao-infantil | 4 | 97 |
| redacao-1000 | 3 | 0 |
| fisica-quimica | 3 | 0 |
| concursos-publicos | 3 | 0 |
| portugues-literatura | 3 | 1 |
| matematica | 3 | 13 |
| historia-geografia | 3 | 1 |
| outros-conteudos | 3 | 3 |

Esses registros já compartilhavam URL, mas a consulta anterior tentava resolver um único ID. A página agora reúne os IDs sem alterar nenhum dado. Os IDs e contagens individuais estão no JSON. Categorias relacionadas, mas de escopo diferente, não foram fundidas automaticamente (por exemplo, Educação Cristã, Escola Bíblica Dominical e Ensino Religioso).

## Dez introduções reescritas

| Categoria | Produtos publicados | Palavras |
| --- | --- | --- |
| alfabetizacao | 112 | 194 |
| educacao-infantil | 97 | 196 |
| atividades-ludicas | 94 | 195 |
| ensino-fundamental | 91 | 199 |
| educacao-especial | 64 | 196 |
| datas-comemorativas | 60 | 196 |
| artes | 49 | 202 |
| historia | 30 | 197 |
| bncc | 15 | 203 |
| matematica | 13 | 200 |

Textos únicos com orientação para avaliar e usar recursos, sem promessas de resultados, credenciais de autores ou certificação curricular. A categoria BNCC esclarece que a classificação é informada pelo criador. Páginas de nível de ensino perderam o selo genérico de alinhamento à BNCC e a alegação de autoria por especialistas, incluindo ensino-superior-pos e idiomas-cursos-livres.

## Nomes e identidade de produtos

O nome completo tem prioridade sobre os sufixos de marketing. Se o nome sozinho ultrapassar 60 caracteres, é preservado: 60 é uma meta editorial, não uma obrigação técnica. A mesma prioridade vale para nomes nas descrições; textos complementares são reduzidos primeiro. Não há cortes de nome com reticências. Concordância: 1 material didático / 2 materiais didáticos.

Ambas as rotas de produto apontam canonical para https://www.educalizando.com.br/produto/[slug]. A variante /loja/[slug]/produto/[produtoSlug] não entra no sitemap. Links de loja, compra, atribuição e escolha de licença continuam funcionando. O Product JSON-LD também usa a identidade global; ofertas PLR conservam seu link de licença.

## Verificações finais

- Lint completo: zero erros e 17 avisos preexistentes. Lint dos arquivos desta tarefa: sem erros ou avisos.
- TypeScript: npm run typecheck:vinext aprovado.
- Build real de produção da Cloudflare: node scripts/deploy-cloudflare.mjs --dry-run aprovado, sem publicar. O último build inclui todas as alterações de código desta tarefa.
- Suíte geral npm run test:verify aprovada (inclui financeiro, checkout, integrações, segurança, migrations e limite de tamanho; nenhum desses contratos foi alterado).
- Regressões de SEO aprovadas: verify-seo-quality.cjs, verify-brand-seo.cjs, verify-page-seo.ts, verify-catalog-seo.ts e verify-product-seo-render.cjs.
- HTTP local: 378 URLs do sitemap auditadas, zero falhas pendentes. A auditoria integral foi seguida pela revalidação de 18 páginas cujos títulos foram ajustados; cada resultado foi integrado ao mesmo relatório, sem apagar falhas não resolvidas.
- Mais 94 verificações HTTP de todas as lojas e categorias, das duas páginas de nível indicadas e de cinco variantes de produto. Zero falhas. robots.txt/sitemap.xml retornam 200; páginas inexistentes de loja/produto/blog retornam 404; páginas privadas permanecem noindex/nofollow.
- Testes de restauração automática foram feitos com fixtures, sem publicar/despublicar produtos reais. Falha de banco não é convertida em catálogo vazio.
- Sem deploy nesta etapa. Commits locais preparados; os dados reais e as regras comerciais foram preservados.

## Arquivos alterados

| Arquivo | Motivo |
| --- | --- |
| src/lib/seo-index-policy.ts | Regras únicas de contagem, noindex e consolidação; pares de lojas e tratamento de empates. |
| src/lib/seo-public-catalog.ts | Leituras públicas paginadas com cache; reunião de IDs de categorias sem editar produtos. |
| src/lib/catalog-sitemap.ts | Exclusão de lojas vazias, categorias inelegíveis e rotas alternativas de produto. |
| src/lib/category-editorial.ts | Dez introduções originais com mais de 150 palavras e orientação factual. |
| src/app/categorias/[slug]/page.tsx | Metadata, conteúdo, catálogo e dados estruturados coerentes com a categoria principal. |
| src/app/loja/[slug]/page.tsx | Robots automático e contagem de publicados para indexação da loja. |
| src/app/atividades-por-ano/[slug]/page.tsx | Remoção das alegações não verificadas de BNCC e especialistas. |
| src/lib/page-seo.ts | Prioridade para nomes completos, redução dos sufixos e concordância singular/plural. |
| src/lib/seo.ts | Opção para preservar nomes também nos cartões sociais. |
| src/lib/catalog-seo.ts | Canonical e identidade global únicos; nomes completos nas metadata de produto. |
| src/lib/seo-identity.ts | Referências de produtos homônimos iguais em ambos os contextos de URL. |
| scripts/verify-seo-quality.cjs | Regressões dos limiares, duplicidades, retorno automático, nomes e textos. |
| scripts/audit-local-seo-quality.mjs | Verificação HTTP de todas as lojas/categorias e amostras de aliases de produto. |
| scripts/report-seo-quality.cjs | Geração reproduzível do comparativo e das listas de revisão. |
| scripts/audit-local-brand-seo.mjs | Sitemap sem aliases/noindex; nomes completos podem ultrapassar a meta editorial. |
| scripts/verify-brand-seo.cjs | Atualização do contrato de canonical e do catálogo compartilhado. |
| scripts/verify-catalog-seo.ts | Regressão de canonical único e descrição factual preservando licença. |
| scripts/verify-page-seo.ts | Regressão de nomes completos e concordância das contagens. |
| ops/SEO-QUALIDADE-CONTEUDO-2026-10-16.md | Relatório legível, decisões, resultados e arquivos alterados. |
| ops/seo-qualidade-2026-10-16.json | Lista auditável de cada URL removida, lojas, categorias, IDs e contagens. |
