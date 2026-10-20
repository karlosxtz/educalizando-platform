# Planejamento e comunidade — 19/10/2026

## Onde encontrar

- `/cliente/planejamento`: planos privados por turma, disciplina e data, observações e referências a até 30 materiais; imprimir/salvar PDF pelo navegador. Seleção a partir das compras autorizadas, favoritos ou botão no produto. Até 100 planos por conta.
- `/cliente/buscas-salvas`: até 20 buscas com filtros, exclusão e avisos opcionais consultados ao abrir a tela. O catálogo oferece o botão “Salvar esta busca”. Avisos não enviam e-mail ou WhatsApp.
- `/dashboard/perguntas`: perguntas dos compradores dos produtos da própria loja, resposta e ocultação. A página pública do produto mostra somente respostas não ocultas, sem identificadores do comprador.
- `/dashboard/enquetes`: pergunta com 2–5 opções e duração de 1–30 dias; até 5 abertas por loja. Publicação em todos os seis temas de loja, encerramento e resultados agregados. Um voto por conta; autor não vota; respostas não podem ser alteradas após publicação.
- Produto: calculadora de impressão, quantidade de alunos, páginas, exemplares, custo por lado e frente e verso. O cálculo arredonda folhas para cada exemplar. Metadados de páginas do produto final não são usados para presumir o conteúdo de uma licença PLR.

## Dados e segurança

Aplicar `supabase/migrations/20261020010000_teaching_workspace.sql` (usuário confirmou execução sem erros). Cria cinco tabelas privadas e duas funções exclusivas de `service_role`. Não modifica políticas, tabelas, checkout ou arquivos de entrega existentes. Sessão validada por Bearer/cookie e servidor resolve usuário e loja; IDs enviados pelo navegador não definem o proprietário. Perguntas ficam vinculadas ao produto, sem uma segunda FK de loja que criaria nova ambiguidade de relacionamento.

`teaching_poll_vote` bloqueia a linha da enquete antes de validar encerramento e gravar. Constraint única impede voto duplicado. `teaching_poll_results` retorna somente totais, não os usuários.

Planos guardam somente notas e identificadores/títulos de materiais. PDF não contém arquivos pagos nem links privados. Os links públicos PLR mantêm `licenca=plr`. Compras continuam nos fluxos de acesso já existentes.

Buscas salvas mantêm somente filtros permitidos, nome e consentimento. Consultas de novidades exibem até os 24 resultados mais recentes, publicados após salvar a busca. A tela informa essa limitação e oferece a busca completa. Não há promessa de entrega de notificações em segundo plano. Alteração de preço ou republicação não é tratada como material novo. Não coletamos dados de alunos na calculadora.

## Arquivos por responsabilidade

- Migration acima: persistência privada, índices e agregação/voto.
- `src/lib/teaching-tools.ts`: limites, validação de planos, filtros e enquetes; cálculo de impressão.
- `src/lib/teaching-api.ts`: autenticação compartilhada, limite de requisições, respostas privadas e erros de ativação.
- `src/app/api/customer/teaching-plans/route.ts`: CRUD limitado ao usuário autenticado.
- `src/app/api/customer/saved-searches/route.ts`: buscas, opt-in e novidades com resposta sanitizada.
- `src/app/api/material-questions/route.ts`: leitura pública de perguntas respondidas e envio autenticado.
- `src/app/api/creator/material-questions/route.ts`: consulta paginada e resposta apenas da loja proprietária.
- `src/app/api/creator/polls/route.ts`: gestão de enquetes da própria loja.
- `src/app/api/store-polls/route.ts`: enquetes públicas, totais e voto autenticado.
- `src/components/teaching/{LessonPlanner,PlanningLink,PrintingCalculator,ProductQuestions,SaveSearchControl,StorePolls}.tsx`: interfaces das cinco funções, estados vazios e falhas.
- `src/app/aluno/(protected)/{planejamento,buscas-salvas}/page.tsx`: áreas privadas, acessíveis pelo alias `/cliente` já existente.
- `src/app/dashboard/{perguntas,enquetes}/page.tsx`: novas áreas do criador.
- `src/app/buscar/page.tsx`: salvar a busca com os filtros atuais.
- `src/app/loja/[slug]/produto/[produtoSlug]/ProductDetailClientView.tsx`: planejamento, impressão e perguntas no produto.
- `src/app/loja/[slug]/themes/ThemeDefault.tsx` e `src/components/store/themes/StorefrontTheme.tsx`: enquetes nos seis temas.
- `src/components/aluno/StudentHeader.tsx`: navegação das ferramentas, inclusive em celular.
- `src/components/dashboard/Sidebar.tsx`: acesso às perguntas e enquetes.
- `src/app/privacidade/page.tsx`: transparência de dados e preferências.
- `scripts/verify-teaching-workspace.cjs`: validação, isolamento por usuário/loja, visibilidade e cálculo; `scripts/verify-store-themes.cjs`: mock da seção opcional para preservar os testes dos temas.

## Verificação

Testes de isolamento e regras em `node scripts/verify-teaching-workspace.cjs`. Regressões: seis melhorias anteriores, crescimento do comprador, relações do catálogo e temas. Lint completo, typecheck Vinext e build de produção + Wrangler dry-run são obrigatórios antes da publicação. Registros em `.cloudflare/teaching-tools-*.log` (ignorados pelo Git).

Resultado: lint completo aprovado (0 erros, 14 avisos preexistentes), typecheck aprovado e build Vinext + Wrangler dry-run aprovado. Todos os testes citados passaram. Publicação do código `fd24442` confirmada pela abertura das novas rotas no domínio canônico.

Conferência no navegador autenticado: enquetes e perguntas carregaram os estados vazios sem erro de banco; buscas salvas também carregaram corretamente. Na página real de “60 FICHAS DE LEITURA”, a calculadora exibiu 75 lados, 50 folhas e R$ 15,00 para 25 alunos, 3 páginas e R$ 0,20 por lado em frente e verso. O botão de planejamento abriu a área privada com esse material já selecionado. Sem transbordamento horizontal na largura observada de 862 px. Captura: `.cloudflare/teaching-planner-live.png`.

Limite da conferência: o navegador foi desativado nas configurações do Work antes do teste de salvar/recarregar um plano e uma busca. Não foram criadas perguntas, votos ou enquetes fictícias na produção. As regras de gravação e propriedade foram verificadas pelos testes automatizados; não declarar gravação completa via interface como validada. Impressão/PDF e telas estreitas de celular ainda não foram conferidas visualmente.

## Evolução visual das cinco ferramentas

Reorganização da interface, mantendo endpoints, validações e persistência existentes. Sem migration adicional.

Arquivos alterados e motivos:

- `src/components/teaching/TeachingStudio.module.css` (novo): linguagem visual comum com tons suaves de verde e lilás, tipografia e espaços, botões arredondados, formulários com foco visível, colunas adaptáveis, estados vazios, redução de movimento e estilos de impressão. Regras limitadas aos componentes destas ferramentas.
- `src/components/teaching/TeachingStudio.tsx` (novo): cabeçalho ilustrado com ícones locais, etapas, avisos, estados vazios e controle de preferência com checkbox acessível. Nenhum serviço de imagem externo ou geração paga por acesso.
- `src/components/teaching/LessonPlanner.tsx`: organização por contexto, roteiro e materiais; lista lateral com plano ativo; navegação e ajuda sobre PDF e arquivos. Todos os campos e ações anteriores permanecem.
- `src/app/aluno/(protected)/planejamento/page.tsx`: fundo e largura consistentes com o novo visual.
- `src/app/aluno/(protected)/buscas-salvas/page.tsx`: filtros com rótulos compreensíveis, cartões de seleção, avisos opcionais com explicação e orientação para salvar a primeira busca.
- `src/app/dashboard/enquetes/page.tsx`: formulário em três etapas, prévia local do texto e das opções antes de publicar, resumo baseado nos dados reais da lista e resultados melhor organizados. Prévia não envia conteúdo nem registra votos.
- `src/app/dashboard/perguntas/page.tsx`: caixa de perguntas com filtros locais (todas, para responder, respondidas e ocultas), sinalização de visibilidade e orientações para responder. Filtros operam somente sobre a página carregada, explicitado na interface.
- `src/components/teaching/PrintingCalculator.tsx`: painel expansível, campos orientados, preferência frente e verso e resumo do custo com detalhe sobre o cálculo. Mesma função de estimativa anterior.
- `src/components/teaching/SaveSearchControl.tsx`: convite compacto para salvar a seleção, formulário expansível e explicação da preferência de novidades.
- `src/components/teaching/ProductQuestions.tsx`: área de conversa no produto com respostas legíveis, formulário separado e orientações sobre privacidade.
- `src/components/teaching/StorePolls.tsx`: apresentação das enquetes e resultados nos temas de loja, incluindo confirmação visual do voto registrado; nenhum total ilustrativo.
- Este relatório: registro das mudanças e limitações da conferência.

Validação: testes existentes de ferramentas, seis melhorias, crescimento do comprador e temas passaram. Lint completo: 0 erros e os mesmos 14 avisos preexistentes. Typecheck Vinext aprovado. Build de produção e Wrangler dry-run em `.cloudflare/teaching-premium-build.log`. Conferência visual no navegador indisponível porque o uso local está desativado no Work; não afirmar que houve inspeção visual ou teste de interações nesta reformulação.
