# Marketplace e vídeos de apresentação

## Uso

- `/marketplace-de-materiais-pedagogicos`: catálogo visual, busca, categorias, paginação e destaques com vídeos reais dos produtos publicados.
- `/videos`: demonstrações dos criadores, com acesso ao material e à loja.
- Painel → Meus Produtos → cadastrar/editar → etapa **Capa do Produto** → **Mostre seu material em ação**. Cole o link público e, opcionalmente, marque **Usar vídeo como capa na vitrine**. Salve o produto normalmente.
- A imagem de capa continua necessária como alternativa. Um vídeo de apresentação não substitui o arquivo entregue ao comprador.
- Links antigos do Instagram continuam disponíveis e aparecem preenchidos ao editar. O formulário usa um único campo para evitar versões concorrentes.

## Reprodução e entrega

YouTube: prévia silenciosa após 450 ms de hover em computador com ponteiro preciso, respeitando movimento reduzido. Celular: botão para assistir. Instagram: incorporação oficial após clique; o autor/provedor pode restringir o embed, exigir login ou interação adicional. Há link para o original. Não há garantia de reprodução automática do Instagram.

Nenhum vídeo é enviado ao MinIO, transformado ou transmitido pelo Worker. Os provedores servem os vídeos diretamente. As capas continuam na arquitetura atual de imagens do MinIO. Sem iframe no carregamento inicial; um player por vez, interrompido ao sair da área visível ou ocultar a aba. Os temas legados mantêm seus links de produto e usam prévia passiva para não inserir botões dentro desses links.

## Dados e segurança

Migration `20261019010000_add_product_presentation_video.sql` executada pelo usuário e reconhecida nas consultas locais. Acrescenta somente `presentation_video_url` e `video_as_cover`. Não modifica registros existentes, políticas, RLS, preços, checkout ou entrega. URLs HTTPS verificadas por lista de hosts e estrutura de vídeo; nenhum HTML arbitrário aceito. A autorização e propriedade do produto continuam verificadas na API.

As páginas usam apenas projeção de campos públicos, sem arquivo de entrega, tokens ou dados do comprador. Não foram cadastrados produtos ou vídeos fictícios. A consulta local encontrou 24 materiais com vídeos válidos já cadastrados. Contagens podem mudar com o catálogo.

## SEO e cache

As duas páginas possuem canonical no domínio oficial, metadata social e breadcrumb. Busca, filtros, paginação e estados vazios/indisponíveis usam noindex/follow. Raízes com conteúdo entram no sitemap. O cache público existente inclui as novas rotas e a invalidação atual do catálogo ao salvar produto/loja também as alcança. Nenhum novo KV, R2, serviço de transformação ou SDK social foi adicionado.

## Verificação

- Lint: sem erros (17 avisos anteriores ao trabalho).
- Typecheck Vinext: passou.
- Testes: parser/player, upload/cadastro/edição, temas de loja, tamanho de fontes, CSP e cache público passaram. O teste do player cobre clique, hover silencioso, preferência de movimento reduzido, exclusão de players concorrentes e parada fora da tela.
- Navegador local: marketplace e galeria com dados reais; Instagram abriu o post oficial. Busca por “bingo” funcionou; filtros usam noindex. Layout conferido em 1366 × 900 e 390 × 844, sem overflow horizontal da página. Iframes iniciais: zero.
- Build de produção: executado pelo script real `node scripts/deploy-cloudflare.mjs --dry-run` (Vinext/Vite + empacotamento Wrangler). A opção dry-run valida o pacote; a publicação usa o build automático da Cloudflare ao receber os commits.
- A persistência foi testada com banco simulado e schema real lido. Nenhum produto de criador foi alterado para teste.

## Arquivos alterados e motivos

| Arquivo | Motivo |
| --- | --- |
| `supabase/migrations/20261019010000_add_product_presentation_video.sql` | Campos opcionais de apresentação e escolha de capa. |
| `src/lib/presentation-video.ts` | Normalização e validação estrita de links públicos. |
| `src/lib/types.ts` | Tipagem dos novos campos. |
| `src/lib/product-update-payload.ts` | Permitir somente os campos novos previstos. |
| `src/app/api/produtos/post.ts` | Validar e persistir vídeo na criação. |
| `src/app/api/produtos/put.ts` | Validar e persistir vídeo na edição, mantendo ownership. |
| `src/components/dashboard/ProductVideoFields.tsx` | Campo, ajuda, prévia e controle da capa. |
| `src/app/dashboard/produtos/novo/page.tsx` | Estado, preenchimento existente e payload único do vídeo. |
| `src/app/dashboard/produtos/novo/ProductWizardView.tsx` | Exibir controles na etapa da capa. |
| `src/app/dashboard/produtos/novo/ProductWizardStepOne.tsx` | Retirar campo antigo duplicado do Instagram. |
| `src/components/PresentationVideoPlayer.tsx` | Player oficial com carregamento por intenção e controles. |
| `src/components/store/StoreVideoCover.tsx` | Capa compatível com links dos temas existentes. |
| `src/components/ProductCard.tsx` | Vídeo como capa quando escolhido pelo criador. |
| `src/components/store/themes/StorefrontProductCard.tsx` | Capa em vídeo nos estilos novos da loja. |
| `src/app/loja/[slug]/themes/ThemeDefault.tsx` | Integrar capa mantendo a navegação do tema. |
| `src/app/loja/[slug]/themes/ThemeMinimalist.tsx` | Integrar capa mantendo a navegação do tema. |
| `src/app/loja/[slug]/themes/ThemeNetflix.tsx` | Integrar capa mantendo a navegação do tema. |
| `src/app/loja/[slug]/themes/ThemePinterest.tsx` | Integrar capa mantendo a navegação do tema. |
| `src/app/loja/[slug]/themes/ThemeLinkTree.tsx` | Integrar capa mantendo a navegação do tema. |
| `src/app/loja/[slug]/produto/[produtoSlug]/ProductDetailClientView.tsx` | Vídeo unificado na galeria do produto. |
| `src/lib/homepage-presentation.ts` | Transportar os novos campos no DTO público. |
| `src/lib/product-read-service.ts` | Incluir vídeo nas consultas públicas de cards. |
| `src/lib/public-page-data.ts` | Incluir vídeo nos produtos relacionados. |
| `src/lib/discovery-catalog.ts` | Consulta pública paginada, busca e filtros. |
| `src/components/CreatorVideoCard.tsx` | Card com demonstração, loja e material. |
| `src/components/PublicDiscoveryPage.tsx` | Layout das páginas, filtros, estados e SEO. |
| `src/app/marketplace-de-materiais-pedagogicos/page.tsx` | Nova rota do marketplace visual. |
| `src/app/videos/page.tsx` | Nova galeria de vídeos dos criadores. |
| `src/components/MarketplaceHeader.tsx` | Acesso às duas páginas na navegação. |
| `src/components/Footer.tsx` | Links permanentes de descoberta. |
| `src/components/HomepageMarketplace.tsx` | Chamadas para marketplace e vídeos na home. |
| `src/app/sitemap.ts` | Incluir as novas raízes quando houver conteúdo. |
| `cloudflare/public-page-cache.js` | Cache público das novas rotas, sem cache de filtros. |
| `next.config.ts` | Autorizar somente os frames oficiais necessários no CSP. |
| `src/app/privacidade/page.tsx` | Explicar carregamento dos players externos. |
| `scripts/verify-presentation-video.cjs` | Testar validação, intenção, hover e ciclo de vida. |
| `scripts/verify-product-create.cjs` | Testar persistência/validação dos campos de vídeo. |
| `scripts/verify-store-themes.cjs` | Compatibilidade dos temas com a nova capa. |
| `scripts/verify-public-page-cache.mjs` | Verificar cache e bypass das novas rotas. |
| `ops/MARKETPLACE-VIDEOS-2026-10-19.md` | Uso, limites, verificação e inventário da entrega. |
