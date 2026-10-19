# Descoberta e conversão — 19/10/2026

## Entrega

- Coração para favoritar nos cards, lojas e página do produto. A lista fica em `/cliente/favoritos`.
- Seguir lojas e escolher explicitamente se deseja ver novos materiais na própria área de favoritos. Não há disparo automático de e-mail ou WhatsApp neste recurso.
- Avaliação autenticada com token ou cookie, somente após compra paga. O selo de compra verificada depende de evidência de pagamento; a aprovação editorial existente continua valendo.
- Resumo visual do conteúdo, prévia e demonstração antes da compra, usando somente os campos reais cadastrados pelo criador.
- Painel “Da visita à compra” em `/dashboard/metricas-anuncios`, com sessões por material e compras provenientes de pedidos pagos.
- Busca com sugestões de materiais, categorias e temas, incluindo navegação por teclado.

## Banco

O usuário confirmou execução sem erros de `supabase/migrations/20261019190000_buyer_discovery_and_conversion.sql`. A migration adiciona somente tabelas privadas e função de resumo, sem mudar as políticas das tabelas existentes. As rotas autenticadas conferem o usuário e a propriedade da loja antes de usar o cliente de servidor.

## Limites dos indicadores

As visitas começam a ser coletadas após a ativação e dependem do consentimento v2 da plataforma. Não existe reconstrução retroativa de visitas. As compras são pedidos pagos do período, mesmo que a navegação não tenha sido medida. Portanto, não se deve dividir compras por visitas como se fossem uma mesma coorte nem afirmar que uma venda veio do Google com base neste painel.

A soma de sessões por produto pode contar uma sessão mais de uma vez no total. Os eventos são deduplicados por loja/produto/sessão/etapa/dia. O painel exclui eventos com mais de 90 dias da loja consultada; lojas inativas precisam de manutenção periódica do banco para remoção de eventos antigos. Isso está descrito na página de privacidade.

## Arquivos e motivos

| Arquivo | Motivo |
|---|---|
| `supabase/migrations/20261019190000_buyer_discovery_and_conversion.sql` | Tabelas privadas de lojas seguidas e eventos, índices e resumo restrito ao servidor. |
| `src/lib/customer-api.ts` | Autenticar chamadas privadas com a sessão existente e limitar espera. |
| `src/lib/buyer-favorites.ts` | Compartilhar favoritos entre cards com proteção contra troca de usuário. |
| `src/components/FavoriteProductButton.tsx` | Botão acessível de favoritar e retorno após login. |
| `src/components/ProductCard.tsx` | Favoritar no catálogo. |
| `src/components/store/themes/StorefrontProductCard.tsx` | Favoritar nos cinco temas adicionais. |
| `src/app/loja/[slug]/themes/ThemeDefault.tsx` | Favoritos e seguir loja no tema padrão. |
| `src/components/store/themes/StorefrontHero.tsx` | Seguir loja nos temas adicionais. |
| `src/components/MarketplaceHeader.tsx` | Acesso à lista de favoritos. |
| `src/app/loja/[slug]/produto/[produtoSlug]/ProductDetailClientView.tsx` | Favoritar, seguir a loja e mostrar conteúdo antes da compra. |
| `src/app/api/customer/followed-stores/route.ts` | Leitura e gravação privadas dos seguidores e novidades autorizadas. |
| `src/components/StoreFollowControl.tsx` | Seguir/desseguir e consentir novidades com tratamento de troca de sessão. |
| `src/components/aluno/FollowedStores.tsx` | Listar lojas e novos materiais com opt-in. |
| `src/app/aluno/(protected)/favoritos/page.tsx` | Reunir favoritos, lojas e novidades; sincronizar remoções. |
| `src/lib/product-review-write.ts` | Reutilizar a validação de compra paga no servidor. |
| `src/app/api/customer/product-reviews/route.ts` | Receber avaliação com Bearer ou cookie e limite de requisições. |
| `src/app/actions/review-actions.ts` | Preservar ação antiga e conferir o selo por evidência real. |
| `src/components/StudentReviewModal.tsx` | Usar a API autenticada no envio da avaliação. |
| `src/components/ProductReviewsSection.tsx` | Exibir selo somente em compra comprovada. |
| `src/lib/types.ts` | Tipar a comprovação de compra da avaliação. |
| `src/components/ProductQuickSpecs.tsx` | Apresentar conteúdo, prévia e vídeo com dados reais e PLR separado. |
| `src/components/store/ProductPublicSummary.tsx` | Disponibilizar o resumo também no conteúdo inicial do servidor. |
| `src/lib/conversion-events.ts` | Validar lote, UUID, etapas e remover campos não permitidos. |
| `src/lib/conversion-client.ts` | Coletar somente com consentimento, deduplicar e limpar na recusa. |
| `src/app/api/catalog-conversion/route.ts` | Conferir produto publicado e loja antes de registrar eventos. |
| `src/app/api/dashboard/conversion/route.ts` | Conferir propriedade da loja e resumir eventos e pedidos pagos. |
| `src/components/dashboard/StoreConversionPanel.tsx` | Indicadores e tabela por material com explicação dos limites. |
| `src/app/dashboard/metricas-anuncios/page.tsx` | Incluir o painel de conversão na área existente. |
| `src/components/PlatformAnalytics.tsx` | Integrar consentimento e eventos de carrinho/checkout. |
| `src/components/store/StoreAnalytics.tsx` | Registrar visualização do material somente com consentimento da plataforma. |
| `src/lib/platform-analytics.ts` | Nova versão de consentimento e páginas públicas adicionais. |
| `src/app/privacidade/page.tsx` | Explicar métricas internas, retenção, favoritos e novidades. |
| `src/lib/search-suggestions.ts` | Sugerir categorias e temas com normalização de acentos. |
| `src/lib/search-service.ts` | Retornar identificador do material e usar dados públicos de cards no fallback. |
| `src/components/SearchBar.tsx` | Autocomplete acessível, cache limitado e sugestões por tipo. |
| `scripts/verify-buyer-growth.cjs` | Testar isolamento, opt-in, autorização, compra paga e coleta consentida. |
| `scripts/verify-platform-analytics.cjs` | Preservar regressões de consentimento com o coletor novo. |
| `scripts/verify-store-analytics.cjs` | Preservar regressões de métricas por loja. |
| `scripts/verify-store-themes.cjs` | Preservar testes de temas e carrinho com os novos controles. |
| `package.json` | Comando reproduzível `test:buyer-growth`. |
| `ops/COMPRADORES-CONVERSAO-2026-10-19.md` | Registrar entrega, arquivos e limites operacionais. |

## Verificação

Testes dedicados de compradores, analytics da plataforma/loja, temas, seleção de produto e busca executados. Lint e TypeScript são verificados integralmente; build de produção pelo pipeline Vinext/Vite e validação Wrangler em modo dry-run. A checagem visual depende de reativar o navegador nas configurações do Work, que informou estar desabilitado nesta sessão.

Checkout, Asaas, webhooks, preços e RLS das tabelas existentes não foram modificados.
