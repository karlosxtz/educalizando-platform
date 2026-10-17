# Search Console — Educalizando — 17/10/2026

## Configuração e segurança

Trabalho realizado no navegador integrado do Codex, após login manual do usuário. A propriedade `sc-domain:educalizando.com.br` já estava verificada e acessível. Não foi criada propriedade duplicada; nenhum TXT era necessário. A condição de haver somente propriedade de prefixo não se aplica.

Nenhuma senha, autenticação em duas etapas ou captcha foi preenchido pelo agente. Não foram usados Remover URLs, Alteração de endereço, Excluir propriedade, usuários/permissões, cobrança ou pagamentos. Nenhuma alteração de RLS, preços, checkout, Asaas, arquivos ou cadastros dos criadores.

## Sitemap

- Reenviado `https://www.educalizando.com.br/sitemap.xml` em 17/10/2026.
- Google confirmou **Sitemap enviado**; em seguida, o relatório atualizou para **Processado**, com **378 URLs descobertas**, envio e última leitura em **17/10/2026**.
- HTTP público: 200, `application/xml`, `<urlset>` com 378 entradas. O documento atual é um sitemap único, sem sub-sitemaps a reenviar.
- O relatório mostrava inicialmente um índice antigo com 458 URLs e leitura em 16/10. Ao abrir esse detalhe antigo, o próprio Google respondeu 400. Após o reenvio e processamento, o tipo mudou para Sitemap e a contagem para 378. O 400 foi do painel Google, não de uma rota da Educalizando.
- Prova visual: `ops/search-console-sitemap-2026-10-17.png`.

## Indexação: todas as oito categorias do relatório

O painel informa atualização em **11/10/2026**: **441 indexadas** e **324 não indexadas**. Os exemplos individuais apresentam rastreamentos de setembro e até 13/10; esses resultados históricos não descrevem automaticamente o estado do site em 17/10. Não é correto comparar o total histórico indexado diretamente com as 378 URLs selecionadas no sitemap atual.

| Motivo | URLs | Diagnóstico e tratamento |
|---|---:|---|
| Excluída pela tag noindex | 194 | Lista completa lida: 186 URLs de busca, 1 offline, 1 disciplina e 6 URLs antigas de produtos. Buscas filtradas/offline não precisam ser indexadas. A disciplina já responde 200, index/follow e canonical próprio. As seis URLs antigas retornam 404 real e estão fora do sitemap; não criar redirects por mera semelhança de nome. |
| Página alternativa com tag canônica adequada | 13 | Exemplos completos: variantes PLR, filtros de busca e filtro de nível da loja. Consolidação de variantes é esperada; preservar canonical e não criar entradas separadas no sitemap. |
| Página com redirecionamento | 7 | Seis URLs HTTP/sem www e `/vender`, cujo destino atual é `/cadastro/produtor`. Redirecionamentos funcionais não são falhas de indexação da URL de destino. |
| Cópia sem página canônica selecionada pelo usuário | 3 | Duas buscas por data e `/aluno/login`. As duas buscas atuais foram conferidas por HTTP: 200, noindex/follow e canonical `/buscar`; login atual tem noindex/nofollow. Não tornar login público/indexável para eliminar uma linha antiga do relatório. |
| Não encontrado (404) | 1 | `/produto/kit-das-caixinhas-da-alfabetizacao-yvy5`: hoje responde 308 para a URL atual do material. Aguardar novo rastreamento; não cadastrar produto fictício nem devolver 200 para URL inexistente. |
| Bloqueada pelo robots.txt | 1 | `/cliente/login?from=doce-aprender-pedagogico-plr`: acesso privado, bloqueio intencional. Preservado. |
| Rastreada, mas não indexada no momento | 20 | Todos os exemplos lidos. Mistura páginas públicas, loja sem produtos, variantes, imagens/favicon/manifest e buscas. As páginas públicas de conteúdo verificadas estão 200, index/follow e canonical correto. Loja vazia atividade-criativa já tem noindex/follow. Não é motivo para indexar assets ou buscas. |
| Detectada, mas não indexada no momento | 85 | Todos os exemplos lidos; validação já aparecia Iniciado antes desta sessão. Inclui lojas, materiais, páginas editoriais e cadastros privados. As três lojas prioritárias atuais respondem 200, index/follow e canonical próprio. Pedir rastreamento somente das nove URLs autorizadas. |

As URLs exatas e contagens estão em `ops/search-console-evidencias-2026-10-17.json`. Dados públicos das verificações HTTP estão em `ops/search-console-verificacao-http-2026-10-17.json`.

## Experiência e dados estruturados

| Relatório | Válidos | Inválidos | Avisos e ação |
|---|---:|---:|---|
| Core Web Vitals | — | — | Celular e computador sem dados suficientes nos últimos 90 dias; atualização 13/10. Ausência de dados não é aprovação nem erro de performance. |
| HTTPS | 64 | 0 não HTTPS | Nenhum erro crítico; atualização 15/10. |
| Snippets do produto | 22 | 0 | 22 avisos de aggregateRating ausente e 22 de review ausente. O código já emite média/contagem somente quando há avaliações reais aprovadas. Não inventar depoimentos ou notas para suprimir avisos opcionais. |
| Listagens do comerciante | 22 | 0 | 22 avisos de shippingDetails e 22 de hasMerchantReturnPolicy. Materiais digitais não justificam inventar prazo/frete físico nem política de devolução. Políticas reais exigem definição e aprovação comercial; não foram alteradas. Name/identificador global aparecem com zero itens afetados. |
| Breadcrumbs | 46 | 0 | Nenhum problema detectado. |
| Snippets de avaliação | 0 | 0 | Nenhum erro detectado; não equivale a haver avaliações reais. |
| Organization e FAQ | — | — | Não há relatório específico desses tipos na navegação desta propriedade. A home atual contém Organization, WebSite e FAQPage; ausência de relatório separado não comprova falha no JSON-LD. |

Produtos, listagens, breadcrumbs e avaliações: atualização 14/10/2026. Não foi encontrado erro crítico de dados estruturados a corrigir no código nesta leitura.

## Verificação do código e do site atual

- Inspecionados `src/lib/catalog-seo.ts`, `src/components/store/ProductPublicSummary.tsx`, `src/lib/search-seo.ts`, `src/app/robots.ts`, `src/app/sitemap.ts` e metadata da disciplina.
- Auditoria HTTP de 33 endereços selecionados a partir dos exemplos reais e das nove prioridades: nenhum 500/1102; home e prioridades com 200, canonical e H1 único; sitemap e robots 200.
- A home mantém Organization, WebSite e FAQPage. Produtos públicos verificados mantêm Product e BreadcrumbList renderizados no HTML.
- Não houve alteração de implementação nesta etapa: os problemas históricos amostrados já têm tratamento no código/site atual, são exclusões intencionais ou aguardam rastreamento. Alterar regras corretas apenas para zerar contagens do painel causaria regressão.
- Não foi acionado **Validar correção**: nenhuma correção nova foi publicada nesta sessão, e as exclusões intencionais devem permanecer.

## Fontes oficiais

- [Relatório de indexação: exclusões legítimas e diagnóstico](https://support.google.com/webmasters/answer/7440203?hl=pt-BR).
- [Product snippets: propriedades e avisos opcionais](https://developers.google.com/search/docs/appearance/structured-data/product-snippet).
- [Merchant listings: propriedades e erros críticos versus recomendações](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing).

## Solicitações de indexação concluídas

Cada linha abaixo teve confirmação explícita **Indexação solicitada**. Não foi atingida a cota e não houve desafio de captcha a resolver. Nenhuma outra URL recebeu solicitação individual.

| URL (prefixo https://www.educalizando.com.br) | Situação anterior à solicitação | Envio |
|---|---|---|
| `/` | Já estava no Google | Aceito |
| `/lojas` | Já estava no Google | Aceito |
| `/materiais-didaticos` | Já estava no Google | Aceito |
| `/blog` | Já estava no Google | Aceito |
| `/materiais-gratis` | Já estava no Google | Aceito |
| `/atividades-para-imprimir` | Já estava no Google | Aceito |
| `/loja/loja-da-pro` | Detectada, sem rastreamento anterior | Aceito |
| `/loja/lojinha-pedagogica-da-pro-vanessa` | Detectada, sem rastreamento anterior | Aceito |
| `/loja/universo-pedagogico-da-prof-lu` | Já estava no Google | Aceito |

Recebimento na fila não garante indexação nem posição no Google. Não reenviar repetidamente para tentar aumentar prioridade.

## Cloudflare e o que depende do usuário

- O painel Cloudflare abriu em **Sign in to Cloudflare**. O agente parou sem preencher login, senha, SSO ou verificação. Não houve alteração DNS, cobrança ou Crawler Hints.
- Crawler Hints ficou pendente: caso deseje concluir, o usuário precisa fazer login no navegador integrado. Depois, acessar a zona educalizando.com.br → Caching → Configuration → Crawler Hints, se disponível.
- Aguardar o Google rastrear as URLs e atualizar os relatórios históricos. Nenhuma publicação nova é necessária para as ações do Search Console desta sessão.
- As seis URLs antigas de produtos que hoje são 404 não constam do sitemap. Só cadastrar redirecionamento adicional se houver associação inequívoca com o mesmo material atual; não adivinhar destinos nem modificar cadastros.
- Definir políticas reais de devolução/entrega, caso queira complementar os avisos opcionais de merchant listings; não houve alteração comercial nesta auditoria.

## Verificações locais e arquivos alterados

- `npm run lint`: aprovado, zero erros e 17 avisos existentes.
- `npm run typecheck:vinext`: aprovado.
- `node scripts/verify-brand-seo.cjs`, `node scripts/verify-seo-quality.cjs` e `node scripts/verify-product-seo-render.cjs`: aprovados.
- `node scripts/deploy-cloudflare.mjs --dry-run`: build de produção e empacotamento Wrangler aprovados. Não houve deploy.
- Comparação HTTP: 33 URLs da auditoria principal e duas buscas por data; nenhum erro 500/1102 nas páginas consultadas. Isso não afirma ausência de problemas em todas as rotas ou no catálogo inteiro.

| Arquivo | Motivo |
|---|---|
| `ops/SEARCH-CONSOLE-2026-10-17.md` | Relatório, diagnóstico, confirmações e pendências |
| `ops/search-console-evidencias-2026-10-17.json` | Contagens e exemplos completos observados no painel, mais as nove confirmações |
| `ops/search-console-verificacao-http-2026-10-17.json` | Respostas HTTP, robots, canonical e schemas da amostra atual |

Capturas locais de comprovação: `ops/search-console-sitemap-2026-10-17.png`, `ops/search-console-home-solicitada-2026-10-17.png` e `ops/search-console-ultima-solicitacao-2026-10-17.png`. Não foram incluídas no commit para evitar registrar imagem do perfil Google em histórico Git. Scripts temporários e logs de diagnóstico ficam em `.cloudflare`, fora do commit. Nenhuma alteração de aplicação foi feita nesta etapa; as alterações locais de tarefas anteriores foram preservadas.
