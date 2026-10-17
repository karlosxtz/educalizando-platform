# Revisão local da homepage — Educalizando

Data: 11/10/2026. Alterações locais para revisão; sem publicação.

## Auditoria anterior às alterações

Foram lidos a página principal, HomepageMarketplace, FeaturedMonthlyCampaign, MonthlyCampaignCarousel, UpcomingCalendarDates, SchoolCalendarMonth, ProductCard, StoreCard, MainBannersCarousel, MarketplaceHeader, Footer, RecentlyViewed, loading global, metadata, calendário e seus relacionamentos, serviços de leitura de produtos/lojas e os testes públicos, de SEO, calendário e campanha. Também foram consultadas as instruções locais do Next para componentes de cliente e Suspense/loading.

A página principal é Server Component. As consultas de produtos, banners, lojas e kits já eram independentes e executadas em paralelo; o conteúdo aguardava o conjunto antes de mostrar o header. A seleção de destaque é a dos produtos publicados mais recentes retornados pelo serviço, limitada a quatro. Ofertas, gratuitos e PLR usam os mesmos filtros anteriores. Produtos excluídos/rascunhos continuam filtrados pelo serviço original.

A ordem visual anterior era feita por classes CSS `order-*`: campanha antes dos produtos, próximas datas depois das demais seções, diferente da ordem de leitura no HTML. Os cards móveis usavam duas colunas estreitas e limitavam os títulos a duas linhas. A campanha vazia repetia explicações em dois blocos.

O calendário possui datas, tags e imagens internas já cadastradas em `school-calendar.ts`. A campanha seleciona as tags do mês e alterna entre elas. Produtos temáticos são associados exclusivamente por `seasonal_tags`; nenhum produto é associado pelo título ou descrição.

## Arquivos desta revisão

- `src/app/page.tsx`: shell com header/footer e Suspense para o conteúdo; limite de espera de 15 segundos por seção e registro de falhas.
- `src/components/HomeCatalogSkeleton.tsx`: novo skeleton com espaços proporcionais para capas, títulos e anúncio acessível de carregamento.
- `src/components/HomepageMarketplace.tsx`: reorganização das seções no próprio HTML, grids confortáveis, estado vazio do destaque e explicação compacta da compra.
- `src/components/FeaturedMonthlyCampaign.tsx`: imagem existente preservada inteira, campanha mais compacta, contagem antes de limitar a vitrine a quatro produtos e mensagem vazia curta.
- `src/components/UpcomingCalendarDates.tsx`: datas próximas visíveis em grid, imagens existentes, contagens e destinos conforme vínculos reais.
- `src/components/ProductCard.tsx`: opção visual `showcase` para a homepage/campanha, preservando o comportamento padrão nas outras páginas; títulos completos, capas sem recorte, criador legível, link Ver material e prioridade de carregamento das primeiras capas.
- `tests/e2e/public-mobile.spec.ts`: verificação de ordem atualizada para categorias → produtos → datas → campanha.
- Este relatório.

Não considerar `public/sitemap-0.xml` nem os arquivos de automações que já estavam modificados/não rastreados como parte desta entrega. O sitemap estava modificado antes do início desta revisão e não foi editado por este trabalho.

## Ordem e seções preservadas

Header com a busca existente → categorias → proposta institucional → materiais em destaque → próximas datas para planejar → campanha principal do mês → ofertas → gratuitos → combos → lojas → explicação da compra/ajuda → PLR → acesso ao calendário e temas → carrossel mensal → convite para criadores → vistos recentemente → banners existentes → footer.

Todas as seções anteriores continuam presentes. Seções condicionais continuam condicionais conforme seus dados originais: ofertas, gratuitos, PLR, combos e vistos recentemente. O header, WhatsApp, login, cadastro, carrinho, Quero vender e links públicos continuam usando os componentes existentes. Não foi criada outra busca.

As próximas datas agora ficam todas disponíveis em leitura contínua, inclusive no celular, em vez de esconder três delas atrás da alternância automática. Os carrosséis de banners e campanhas continuam existentes.

## Produtos, datas e estados vazios

Somente produtos retornados pela aplicação são renderizados. Não há catálogo fictício ou preenchimento artificial de vagas. O ProductCard oficial conserva preço, desconto, modalidade, badges, capa, loja e destino. Os manipuladores de adicionar ao carrinho e comprar não foram alterados. O novo link Ver material abre os detalhes existentes.

As próximas quatro ocorrências vêm de `getUpcomingSchoolEvents`, o helper já existente. Nome, data, tipo e arte vêm do calendário existente. Os materiais são contados por tags explícitas. Com um vínculo, o botão abre o produto; com vários, abre a busca temática; sem vínculo, abre o calendário. O link separado para o calendário também aparece quando existem materiais.

**Limite da contagem:** a homepage continua consultando até 100 produtos, como antes. As datas qualificam sua quantidade como pertencente ao catálogo exibido; não apresentam essa amostra como total de toda a plataforma. A campanha conta todos os vínculos nesse conjunto antes de mostrar os primeiros quatro cards. Não foi ampliada nem alterada a consulta comercial.

Sem produtos, Materiais em destaque mantém título e um estado compacto com link para o catálogo. Sem produtos na campanha, a arte e os links de busca/calendário continuam, com uma única explicação curta. Falhas por seção são registradas; nenhuma consulta travada mantém o loading para sempre. Os serviços de dados continuam com seus fallbacks originais.

## Imagens, responsividade e acessibilidade

Nenhuma imagem foi removida, substituída ou criada. Permanecem os URLs das capas, artes das campanhas e datas, banners e logos. Capas da vitrine e artes da campanha/datas usam `object-contain`, com espaço reservado para evitar deformações. ProductCard mantém alt descritivo e o fallback original para ausência/erro de capa. As primeiras capas do destaque carregam imediatamente; as demais continuam com lazy loading.

Grids principais: uma coluna confortável abaixo de 600 px, duas a partir de 600 px, quatro somente a partir de 1280 px. Sem seis cards comprimidos. Os títulos dos produtos na homepage não são truncados. Preço e criador mantêm os valores reais e legibilidade. Foco visível e links HTML permanecem; o loading tem status anunciado e skeleton decorativo oculto de leitores de tela. H1 único e metadata/JSON-LD da página foram preservados.

## Validação

- `npx tsc --noEmit`: falhou com seis diagnósticos apenas em `.next/dev/types/validator.ts` e `.next/types/validator.ts`, por incompatibilidade de tipos de rotas gerados (`LayoutRoute` e exports de `routes.js`). Esses conflitos já haviam sido registrados anteriormente. Não houve diagnóstico nos arquivos de fonte alterados. Não foi apagado o cache nem alterada a configuração de rotas para mascarar o resultado.
- ESLint direcionado aos sete arquivos TS/TSX alterados: passou, sem erros nem avisos.
- `npx playwright test tests/e2e/public-mobile.spec.ts tests/e2e/seo.spec.ts tests/e2e/calendar.spec.ts --workers=2`: 154 testes, **151 passaram e 3 falharam**. Base exclusivamente local `http://localhost:3001`; não houve login, compra, pagamento ou download real.
- Falha SEO 1: o teste espera título com capitalização antiga; a metadata preservada retorna `Materiais didáticos digitais para professores | Educalizando`. A descrição esperada também está desatualizada em relação ao arquivo atual, embora a execução pare no título.
- Falha SEO 2: o teste trata `/sitemap.xml` como lista direta com mais de dez URLs, mas a resposta contém duas referências de sitemap. Não foi alterado o sitemap.
- Falha SEO 3: o teste exige bloco explícito `User-Agent: Googlebot`; o robots atual usa o bloco geral. Não foi alterado o robots.
- Build de Cloudflare/Vinext: passou. Não houve deploy.
- Após o último ajuste de legibilidade do criador e preço, foram repetidos os 11 testes de homepage/header (oito larguras, menu, busca visível e ordem das seções): **11 passaram**. O build e o ESLint direcionado também foram repetidos e passaram.
- Prévia isolada: usou 100 produtos capturados da homepage pública atual, apenas para renderização temporária em `.cloudflare`, sem inserir dados na aplicação. Testados 320, 360, 375, 390, 414, 768, 1024 e 1280 px: sem overflow horizontal, com H1 único e carregamento da primeira capa real em todas as larguras. Também foram verificados zero produtos, um produto sem duplicação, campanha e datas sem vínculos, skeleton e erro forçado de imagem com fallback preservando o título.
- O navegador real da aplicação verificou busca visível, carrinho/entrada acessíveis, menu abrindo e fechando com Escape e retorno de foco; calendário mensal, links e páginas temáticas também passaram.
- Capturas de desktop/celular foram inspecionadas. Os dados da prévia isolada não são seed nem conteúdo publicado; mocks limitam navegação/carrinho nessa prévia, portanto a confirmação do funcionamento do menu/busca vem da suíte da aplicação real, não dos mocks.
- `git diff --check`: passou. `git status --short` e `git diff --stat` foram revisados separando as alterações preexistentes.

Logs e capturas locais ficam em `.cloudflare/home-*`, ignorados pelo Git. Não se deve publicar automaticamente com base apenas no build: as três divergências da suíte SEO e os tipos de rotas gerados precisam ser considerados na revisão.

## Limites respeitados

Nenhum produto fictício criado. Nenhuma imagem real removida. Nenhuma alteração de banco, migration, SQL, Supabase, Vercel, checkout, carrinho, pagamentos, InfinitePay, webhooks, pedidos, downloads, preços, cupons, regras de PLR/afiliados, autenticação, permissões ou APIs comerciais. A opção visual no ProductCard não modifica cálculos nem ações de compra. Nenhum envio de mensagem/e-mail e nenhuma operação real de cliente foram feitos.

Na primeira entrega, não houve commit, push nem deploy; a versão ficou local para revisão.

## Publicação autorizada em 11/10/2026

Após a autorização explícita do usuário, o pacote validado foi publicado na Cloudflare, no Worker `educalizando-app`. Versão: `8881a64b-96b5-43bf-b5ff-1b573f03485a`. Domínio conferido: `https://www.educalizando.com.br/`. Não houve commit nem push.

O sitemap-0.xml público foi preservado no pacote gerado, mantendo intacta a alteração local preexistente desse arquivo. Nenhuma configuração de banco ou autenticação foi modificada durante a publicação.

Verificação após deploy: oito larguras de tela e dois testes do header passaram. O teste da campanha inicialmente encontrou cinco links válidos no seletor que esperava apenas um; foi corrigido para verificar o primeiro link principal, sem mudar a aplicação publicada. A repetição passou e confirmou produtos antes das próximas datas, seguidas da campanha. Resultado final: 11 verificações públicas aprovadas.

Uma inspeção adicional confirmou HTTP 200, H1 único, sete imagens carregadas na seção de destaque (incluindo imagens de criadores) e ausência de erros JavaScript. Capturas de celular e desktop: `.cloudflare/home-live-390.png` e `.cloudflare/home-live-1280.png`. As divergências de SEO e tipos gerados relatadas acima continuam pendentes.

## Ajuste dos materiais das campanhas — 11/10/2026

A pedido do usuário, o carrossel de campanhas da homepage passou a exibir no máximo dois materiais vinculados por tema. A variante visual `campaign` do ProductCard reduz a capa para 160 px no celular e 176 px a partir de 640 px, com texto de 14 px e espaçamento menor. Os títulos completos, imagens sem corte, preços, criadores e ações de compra foram mantidos. A vitrine principal continua usando `showcase`; os totais dos temas continuam contando os vínculos do catálogo carregado, antes de limitar os cards.

ESLint dos dois componentes e build Cloudflare passaram. Prévia conferida nas oito larguras: dois materiais, altura menor e sem overflow. Publicado no Worker `educalizando-app`, versão `183ed2e7-0ccd-4949-a800-a298ab8cf9b9`, preservando novamente o sitemap público. Conferência no domínio oficial: dez campanhas em 390 e 1280 px (20 estados), todas com no máximo dois materiais, capas de 160/176 px, sem overflow nem erros JavaScript. Temas com um ou nenhum vínculo mantêm seus estados reais. Capturas: `.cloudflare/campaign-live-390.png` e `.cloudflare/campaign-live-1280.png`. Sem commit ou push.

## Correção da configuração pública do Supabase — 11/10/2026

Após relato de bloqueio no login, foi identificado que `.env.local` não continha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`. As variáveis estavam configuradas no Worker, mas faltavam no build do navegador. As publicações anteriores desta revisão não haviam validado o envio do formulário de login; apenas a presença dos controles e ausência de erros de renderização.

As duas configurações públicas foram recuperadas do próprio Worker e gravadas somente no arquivo local ignorado pelo Git. Nenhuma chave privada foi copiada ou exibida. O pacote foi reconstruído e publicado na versão `601e7d18-4a62-46ef-876f-8678c10ef23e`, preservando o sitemap e os ajustes visuais.

`scripts/deploy-cloudflare.mjs` agora bloqueia a publicação sem essas variáveis, rejeita chaves que não sejam anon/publishable e confere se o pacote do navegador contém a configuração correspondente. Testes negativos de configuração ausente e pacote incompatível passaram; ESLint e build passaram.

No domínio oficial, Supabase Auth respondeu HTTP 200. O formulário de login enviou a requisição ao projeto correto com a chave pública correta; a requisição de autenticação foi interceptada e devolveu erro de credenciais em português, sem exibir o erro de configuração. Nenhum login real de usuário, envio de e-mail ou alteração de dados foi efetuado. A autenticação com a senha pessoal do usuário não foi testada. Sem commit ou push.
