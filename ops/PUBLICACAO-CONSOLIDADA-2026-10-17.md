# Publicação consolidada — 17/10/2026

Destino: Worker educalizando-app, domínio https://www.educalizando.com.br.

Esta entrega versiona trabalho acumulado e publica o código atual. Não executa migrations, não importa produtos e não instala workflows no n8n. Backups locais com credenciais e capturas de tela pessoais foram ignorados, sem apagar arquivos.

Validação: lint e typecheck completos, build Vinext/Cloudflare com dry-run, regressão geral, uploads, cache, IA, SEO e módulos dos criadores. Dois simuladores de teste receberam o mock de invalidação de cache; ambos passaram após o ajuste. As quatro suítes locais do workflow passaram sem enviar mensagens.

O pacote de produção já foi construído e validado; a publicação usa o script do projeto com --skip-build, sem --dry-run.

## Arquivos pendentes consolidados e motivos

A lista abaixo corresponde ao inventário anterior aos commits desta publicação. Os sete arquivos do commit c0522b1 estão detalhados separadamente em SEO-RELEVANCIA-2026-10-17.md.

| Arquivo | Motivo |
|---|---|
| INSTALACAO EDUCALIZANDO V14.1.md | Documentação e evidências do trabalho anterior |
| INSTALACAO EDUCALIZANDO V15.md | Documentação e evidências do trabalho anterior |
| INSTALACAO EDUCALIZANDO V16.md | Documentação e evidências do trabalho anterior |
| INSTALACAO V17.md | Documentação e evidências do trabalho anterior |
| INSTALACAO V18.md | Documentação e evidências do trabalho anterior |
| TESTE E INSTALACAO - EDUCALIZANDO V14.md | Documentação e evidências do trabalho anterior |
| cloudflare/cache-revision.js | Runtime, dependências, cache e entrega na Cloudflare |
| cloudflare/catalog-image-cache.js | Runtime, dependências, cache e entrega na Cloudflare |
| cloudflare/public-cache-runtime.js | Runtime, dependências, cache e entrega na Cloudflare |
| cloudflare/public-page-cache.js | Runtime, dependências, cache e entrega na Cloudflare |
| cloudflare/response-cache-policy.js | Runtime, dependências, cache e entrega na Cloudflare |
| cloudflare/traffic-guard.js | Runtime, dependências, cache e entrega na Cloudflare |
| deploy/vps/Dockerfile | Arquivo auxiliar revisado, sem credenciais |
| deploy/vps/compose.yaml | Arquivo auxiliar revisado, sem credenciais |
| ops/API-ATENDENTE-LOJISTA.md | Documentação e evidências do trabalho anterior |
| ops/ATENDENTE-CONSULTA-RESTAURADA-2026-10-14.md | Documentação e evidências do trabalho anterior |
| ops/ATENDENTE-CONTEXTO-2026-10-14.md | Documentação e evidências do trabalho anterior |
| ops/ATENDENTE-FORMATACAO-2026-10-14.md | Documentação e evidências do trabalho anterior |
| ops/ATENDENTE-V20-ALTERACOES.md | Documentação e evidências do trabalho anterior |
| ops/ATENDIMENTO-HUMANO-MESMO-WHATSAPP-2026-10-14.md | Documentação e evidências do trabalho anterior |
| ops/BUSCAS-SEM-RESULTADO-2026-10-16.md | Documentação e evidências do trabalho anterior |
| ops/CALENDARIO-OPORTUNIDADES-2026-10-16.md | Documentação e evidências do trabalho anterior |
| ops/CLOUDFLARE-CUSTO-CACHE-2026-10-17.md | Documentação e evidências do trabalho anterior |
| ops/CLOUDFLARE-FREE-2026-10-12.md | Documentação e evidências do trabalho anterior |
| ops/CLOUDFLARE-OTIMIZACAO.md | Documentação e evidências do trabalho anterior |
| ops/CORRECAO-CADASTRO-PRODUTO-2026-10-12.md | Documentação e evidências do trabalho anterior |
| ops/CORRECOES-MIGRACAO-2026-10-12.md | Documentação e evidências do trabalho anterior |
| ops/HOMEPAGE-REVISAO.md | Documentação e evidências do trabalho anterior |
| ops/IA-APRIMORAMENTO-2026-10-13.md | Documentação e evidências do trabalho anterior |
| ops/IA-ESPERA-DESCRICOES-2026-10-13.md | Documentação e evidências do trabalho anterior |
| ops/IA-ESTABILIDADE-2026-10-13.md | Documentação e evidências do trabalho anterior |
| ops/IA-FORMATO-RESPOSTA-2026-10-14.md | Documentação e evidências do trabalho anterior |
| ops/IA-MARKETING-TEXTOS-2026-10-13.md | Documentação e evidências do trabalho anterior |
| ops/IA-MODULO-CONFIABILIDADE-2026-10-14.md | Documentação e evidências do trabalho anterior |
| ops/IA-ORIENTACOES-PRONTAS-2026-10-13.md | Documentação e evidências do trabalho anterior |
| ops/IA-PREENCHER-SEO-2026-10-13.md | Documentação e evidências do trabalho anterior |
| ops/IA-RASCUNHOS-HISTORICO-2026-10-13.md | Documentação e evidências do trabalho anterior |
| ops/IA-RESPOSTA-CORTADA-2026-10-14.md | Documentação e evidências do trabalho anterior |
| ops/IA-TRES-DESCRICOES-2026-10-13.md | Documentação e evidências do trabalho anterior |
| ops/IMAGENS-HOMEPAGE-2026-10-13.md | Documentação e evidências do trabalho anterior |
| ops/IMAGENS-PAINEL-2026-10-14.md | Documentação e evidências do trabalho anterior |
| ops/PAUSA-HUMANA-AUTOMATICA-2026-10-14.md | Documentação e evidências do trabalho anterior |
| ops/PRODUCT-DELIVERY-LINK-FIX-2026-10-16.md | Documentação e evidências do trabalho anterior |
| ops/PROTECAO-SALVAMENTOS-2026-10-12.md | Documentação e evidências do trabalho anterior |
| ops/RECUPERACAO-LOJAS-2026-10-16.md | Documentação e evidências do trabalho anterior |
| ops/REVISAO-ESTRUTURA-2026-10-12.md | Documentação e evidências do trabalho anterior |
| ops/SEO-PUBLICO-2026-10-14.md | Documentação e evidências do trabalho anterior |
| ops/SEO-SINCRONIZACAO-2026-10-14.md | Documentação e evidências do trabalho anterior |
| ops/SEO-UNIFICADO-2026-10-14.md | Documentação e evidências do trabalho anterior |
| ops/UPLOAD-DIRETO-MINIO.md | Documentação e evidências do trabalho anterior |
| ops/WEBHOOKS-PRIVADOS-2026-10-16.md | Documentação e evidências do trabalho anterior |
| ops/WEBHOOKS-RECEBIMENTO-2026-10-16.md | Documentação e evidências do trabalho anterior |
| ops/WOOCOMMERCE-IMPORTACAO-CONTINUA-2026-10-16.md | Documentação e evidências do trabalho anterior |
| public/_headers | Arquivo auxiliar revisado, sem credenciais |
| scripts/_validator_v1821_current.js | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/_validator_v1822_current.js | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/audit-seo-general.mjs | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/build-vps.mjs | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/build_v16.js | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/build_v17.js | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/build_v18.js | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/build_v181.js | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/build_v182.js | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/build_v1821.js | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/build_v1822.js | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/build_v1823.js | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/diagnose-public-images.mjs | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/export-public-image-redirects.mjs | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/validate_v14.js | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/validate_v141.js | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/validate_v15.js | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/validate_v16.js | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/validate_v17.js | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/validate_v18.js | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/validate_v181.js | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/validate_v182.js | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/validate_v1821.js | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/validate_v1822.js | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/validate_v1823.js | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/verify-ai-editor-safety.cjs | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/verify-ai-reliability.cjs | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/verify-ai-workspace.cjs | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/verify-catalog-images.mjs | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/verify-cloudflare-cost-contract.mjs | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/verify-cloudflare-performance.mjs | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/verify-club-save.cjs | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/verify-creator-opportunities.cjs | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/verify-direct-storage-upload.cjs | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/verify-live-seo-sample.mjs | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/verify-live-store-assets.mjs | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/verify-marketing-grounding.cjs | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/verify-migration-client.cjs | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/verify-product-create.cjs | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/verify-product-education.cjs | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/verify-product-relations.cjs | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/verify-public-cache-invalidation.cjs | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/verify-public-links.ts | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/verify-public-page-cache.mjs | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/verify-search-gaps-sql.cjs | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/verify-search-gaps.cjs | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/verify-seo-audit-save.cjs | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/verify-seo-sync.cjs | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/verify-store-cart-recovery.cjs | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/verify-store-cart-sql.cjs | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/verify-store-chatbot-live.mjs | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/verify-store-chatbot-query.ts | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/verify-store-chatbot-route.mjs | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/verify-store-webhook-migration.cjs | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/verify-store-webhook-ui.cjs | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/verify-store-webhooks.cjs | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/verify-webhook-receivers-sql.cjs | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/verify-webhook-receivers-ui.cjs | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/verify-webhook-receivers.cjs | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/verify-woo-import-api-ui.cjs | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/verify-woo-import-jobs-sql.cjs | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/verify-woo-import-queue.cjs | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/verify-woo-import-recovery.cjs | Validação, diagnóstico ou ferramenta de manutenção |
| seo-audit-general-report.json | Confiabilidade da IA, SEO e leitura pública |
| seo-audit-report.json | Confiabilidade da IA, SEO e leitura pública |
| src/app/api/ai/editor-source/route.ts | Confiabilidade da IA, SEO e leitura pública |
| src/app/api/ai/health/route.ts | Confiabilidade da IA, SEO e leitura pública |
| src/app/api/cache/public-revalidate/route.ts | Consolidar correções e apresentação da plataforma |
| src/app/api/creator/cart-recovery/route.ts | Módulos dos criadores e integrações já implementados |
| src/app/api/creator/opportunities/route.ts | Módulos dos criadores e integrações já implementados |
| src/app/api/creator/search-gaps/route.ts | Módulos dos criadores e integrações já implementados |
| src/app/api/creator/webhook-receivers/route.ts | Módulos dos criadores e integrações já implementados |
| src/app/api/creator/webhooks/route.ts | Módulos dos criadores e integrações já implementados |
| src/app/api/creator/woocommerce/import-jobs/route.ts | Módulos dos criadores e integrações já implementados |
| src/app/api/cron/store-webhooks/route.ts | Módulos dos criadores e integrações já implementados |
| src/app/api/store-carts/recover/route.ts | Módulos dos criadores e integrações já implementados |
| src/app/api/store-carts/route.ts | Módulos dos criadores e integrações já implementados |
| src/app/api/store-search-gaps/route.ts | Módulos dos criadores e integrações já implementados |
| src/app/api/webhooks/receive/[receiverId]/[token]/route.ts | Módulos dos criadores e integrações já implementados |
| src/app/clube/[slug]/PublicClubClientView.tsx | Consolidar correções e apresentação da plataforma |
| src/app/dashboard/buscas-sem-resultado/page.tsx | Consolidar correções e apresentação da plataforma |
| src/app/dashboard/carrinhos/page.tsx | Consolidar correções e apresentação da plataforma |
| src/app/dashboard/ia/AiConnectionStatus.tsx | Confiabilidade da IA, SEO e leitura pública |
| src/app/dashboard/ia/AiDescriptionChoices.tsx | Confiabilidade da IA, SEO e leitura pública |
| src/app/dashboard/ia/AiEditorialReview.tsx | Confiabilidade da IA, SEO e leitura pública |
| src/app/dashboard/ia/AiProductEditor.tsx | Confiabilidade da IA, SEO e leitura pública |
| src/app/dashboard/ia/AiResultCards.tsx | Confiabilidade da IA, SEO e leitura pública |
| src/app/dashboard/ia/AiSeoFillPanel.tsx | Confiabilidade da IA, SEO e leitura pública |
| src/app/dashboard/ia/AiSeoGuidance.tsx | Confiabilidade da IA, SEO e leitura pública |
| src/app/dashboard/ia/AiWorkspacePanel.tsx | Confiabilidade da IA, SEO e leitura pública |
| src/app/dashboard/ia/AiWritingOptions.tsx | Confiabilidade da IA, SEO e leitura pública |
| src/app/dashboard/ia/ai-actions.ts | Confiabilidade da IA, SEO e leitura pública |
| src/app/dashboard/ia/useAiWorkspace.ts | Confiabilidade da IA, SEO e leitura pública |
| src/app/dashboard/oportunidades/OpportunityCard.tsx | Módulos dos criadores e integrações já implementados |
| src/app/dashboard/oportunidades/page.tsx | Consolidar correções e apresentação da plataforma |
| src/app/dashboard/webhooks/ReceiverGuide.tsx | Módulos dos criadores e integrações já implementados |
| src/app/dashboard/webhooks/WebhookGuide.tsx | Módulos dos criadores e integrações já implementados |
| src/app/dashboard/webhooks/WebhookHistory.tsx | Módulos dos criadores e integrações já implementados |
| src/app/dashboard/webhooks/WebhookReceivers.tsx | Módulos dos criadores e integrações já implementados |
| src/app/dashboard/webhooks/WebhookSetupForm.tsx | Módulos dos criadores e integrações já implementados |
| src/app/dashboard/webhooks/page.tsx | Módulos dos criadores e integrações já implementados |
| src/app/dashboard/webhooks/webhook-ui.ts | Módulos dos criadores e integrações já implementados |
| src/app/dashboard/woocommerce/WooImportPanel.tsx | Módulos dos criadores e integrações já implementados |
| src/app/retomar-compra/[token]/layout.tsx | Consolidar correções e apresentação da plataforma |
| src/app/retomar-compra/[token]/page.tsx | Consolidar correções e apresentação da plataforma |
| src/app/seguranca/layout.tsx | Consolidar correções e apresentação da plataforma |
| src/components/CampaignAttribution.tsx | Confiabilidade da IA, SEO e leitura pública |
| src/components/HomeCatalogSkeleton.tsx | Consolidar correções e apresentação da plataforma |
| src/components/OnDemandLink.tsx | Consolidar correções e apresentação da plataforma |
| src/components/dashboard/StoreAvatar.tsx | Consolidar correções e apresentação da plataforma |
| src/components/store/ProductEducationBadges.tsx | Consolidar correções e apresentação da plataforma |
| src/components/store/ProductProgressiveView.tsx | Consolidar correções e apresentação da plataforma |
| src/components/store/StoreCartTracker.tsx | Módulos dos criadores e integrações já implementados |
| src/components/store/StoreCatalogMoreButton.tsx | Consolidar correções e apresentação da plataforma |
| src/components/store/useCheckoutRecovery.ts | Módulos dos criadores e integrações já implementados |
| src/components/store/useSearchGapTracking.ts | Consolidar correções e apresentação da plataforma |
| src/lib/ai-catalog-context.ts | Confiabilidade da IA, SEO e leitura pública |
| src/lib/ai-client.ts | Confiabilidade da IA, SEO e leitura pública |
| src/lib/ai-editor-options.ts | Confiabilidade da IA, SEO e leitura pública |
| src/lib/ai-editor-review.ts | Confiabilidade da IA, SEO e leitura pública |
| src/lib/ai-json.ts | Confiabilidade da IA, SEO e leitura pública |
| src/lib/ai-marketing-grounding.ts | Confiabilidade da IA, SEO e leitura pública |
| src/lib/ai-seo-fill.ts | Confiabilidade da IA, SEO e leitura pública |
| src/lib/ai-seo-response.ts | Confiabilidade da IA, SEO e leitura pública |
| src/lib/ai-workspace.ts | Confiabilidade da IA, SEO e leitura pública |
| src/lib/api-response.ts | Consolidar correções e apresentação da plataforma |
| src/lib/catalog-image-url.ts | Uploads, imagens e acesso aos arquivos |
| src/lib/client-api.ts | Consolidar correções e apresentação da plataforma |
| src/lib/creator-opportunities.ts | Módulos dos criadores e integrações já implementados |
| src/lib/direct-storage-upload.ts | Uploads, imagens e acesso aos arquivos |
| src/lib/homepage-presentation.ts | Consolidar correções e apresentação da plataforma |
| src/lib/product-create-request.ts | Consolidar correções e apresentação da plataforma |
| src/lib/product-education-levels.ts | Consolidar correções e apresentação da plataforma |
| src/lib/product-relations-write.ts | Consolidar correções e apresentação da plataforma |
| src/lib/product-save-recovery.ts | Módulos dos criadores e integrações já implementados |
| src/lib/product-update-payload.ts | Consolidar correções e apresentação da plataforma |
| src/lib/public-cache-invalidation.ts | Consolidar correções e apresentação da plataforma |
| src/lib/public-cache-runtime.ts | Consolidar correções e apresentação da plataforma |
| src/lib/public-club-service.ts | Consolidar correções e apresentação da plataforma |
| src/lib/public-image-cache.ts | Uploads, imagens e acesso aos arquivos |
| src/lib/public-image-url.ts | Uploads, imagens e acesso aos arquivos |
| src/lib/public-links.ts | Consolidar correções e apresentação da plataforma |
| src/lib/public-page-data.ts | Consolidar correções e apresentação da plataforma |
| src/lib/public-store-presentation.ts | Consolidar correções e apresentação da plataforma |
| src/lib/request-public-revalidation.ts | Consolidar correções e apresentação da plataforma |
| src/lib/search-seo.ts | Confiabilidade da IA, SEO e leitura pública |
| src/lib/seo-snapshot.ts | Confiabilidade da IA, SEO e leitura pública |
| src/lib/seo-sync.ts | Confiabilidade da IA, SEO e leitura pública |
| src/lib/sitemap-pagination.ts | Consolidar correções e apresentação da plataforma |
| src/lib/store-cart-server.ts | Módulos dos criadores e integrações já implementados |
| src/lib/store-chatbot-query.ts | Consolidar correções e apresentação da plataforma |
| src/lib/store-recovery-client.ts | Módulos dos criadores e integrações já implementados |
| src/lib/store-search-gaps.ts | Módulos dos criadores e integrações já implementados |
| src/lib/store-webhook-contract.ts | Módulos dos criadores e integrações já implementados |
| src/lib/store-webhook-delivery.ts | Módulos dos criadores e integrações já implementados |
| src/lib/store-webhook-inbound-contract.ts | Módulos dos criadores e integrações já implementados |
| src/lib/store-webhook-inbound-server.ts | Módulos dos criadores e integrações já implementados |
| src/lib/store-webhook-payload.ts | Módulos dos criadores e integrações já implementados |
| src/lib/store-webhook-security.ts | Módulos dos criadores e integrações já implementados |
| src/lib/woo-catalog-page.ts | Consolidar correções e apresentação da plataforma |
| src/lib/woo-import-jobs.ts | Consolidar correções e apresentação da plataforma |
| src/lib/woo-import-queue.ts | Consolidar correções e apresentação da plataforma |
| supabase/migrations/20261016150000_create_private_store_webhooks.sql | Versionar migration existente; não executar no deploy |
| supabase/migrations/20261016180000_create_store_webhook_receivers.sql | Versionar migration existente; não executar no deploy |
| supabase/migrations/20261016200000_create_store_search_gaps.sql | Versionar migration existente; não executar no deploy |
| supabase/migrations/20261016220000_create_store_cart_recovery.sql | Versionar migration existente; não executar no deploy |
| supabase/migrations/20261016230000_create_woocommerce_import_jobs.sql | Versionar migration existente; não executar no deploy |
| tsconfig.vinext.json | Runtime, dependências, cache e entrega na Cloudflare |
| tsconfig.vps.json | Runtime, dependências, cache e entrega na Cloudflare |
| vinext-env.d.ts | Runtime, dependências, cache e entrega na Cloudflare |
| workflows/whatsapp-loja/ATENDENTE-EDUCALIZANDO-V20-ATUALIZADO-template.json | Template e testes locais; não importar nem ativar no n8n |
| workflows/whatsapp-loja/LEIA-ME.md | Documentação e evidências do trabalho anterior |
| workflows/whatsapp-loja/build.mjs | Template e testes locais; não importar nem ativar no n8n |
| workflows/whatsapp-loja/educalizando-whatsapp-loja.json | Template e testes locais; não importar nem ativar no n8n |
| workflows/whatsapp-loja/patch-v20.mjs | Template e testes locais; não importar nem ativar no n8n |
| workflows/whatsapp-loja/runtime.mjs | Template e testes locais; não importar nem ativar no n8n |
| workflows/whatsapp-loja/test-v20-human-takeover.mjs | Template e testes locais; não importar nem ativar no n8n |
| workflows/whatsapp-loja/test-v20-improvements.mjs | Template e testes locais; não importar nem ativar no n8n |
| workflows/whatsapp-loja/test-v20.mjs | Template e testes locais; não importar nem ativar no n8n |
| workflows/whatsapp-loja/test.mjs | Template e testes locais; não importar nem ativar no n8n |
| workflows/whatsapp-loja/v20-conversation.mjs | Template e testes locais; não importar nem ativar no n8n |
| workflows/whatsapp-loja/v20-human-takeover.mjs | Template e testes locais; não importar nem ativar no n8n |
| .gitignore | Arquivo auxiliar revisado, sem credenciais |
| AGENTS.md | Documentação e evidências do trabalho anterior |
| cloudflare.config.ts | Runtime, dependências, cache e entrega na Cloudflare |
| cloudflare/product-image-optimizer.js | Runtime, dependências, cache e entrega na Cloudflare |
| cloudflare/worker.js | Runtime, dependências, cache e entrega na Cloudflare |
| eslint.config.mjs | Runtime, dependências, cache e entrega na Cloudflare |
| next.config.ts | Runtime, dependências, cache e entrega na Cloudflare |
| ops/SEARCH-CONSOLE-2026-10-17.md | Documentação e evidências do trabalho anterior |
| ops/search-console-evidencias-2026-10-17.json | Documentação e evidências do trabalho anterior |
| package-lock.json | Runtime, dependências, cache e entrega na Cloudflare |
| package.json | Runtime, dependências, cache e entrega na Cloudflare |
| scripts/deploy-cloudflare.mjs | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/verify-brand-seo.cjs | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/verify-cloudflare-adapters.cjs | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/verify-creator-club.ts | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/verify-product-seo-render.cjs | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/verify-search-matching.ts | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/verify-seo-quality.cjs | Validação, diagnóstico ou ferramenta de manutenção |
| scripts/verify-storage-upload.cjs | Validação, diagnóstico ou ferramenta de manutenção |
| src/app/admin/ClientLayout.tsx | Consolidar correções e apresentação da plataforma |
| src/app/afiliado/[slug]/page.tsx | Consolidar correções e apresentação da plataforma |
| src/app/api/admin/auth-invites/route.ts | Consolidar correções e apresentação da plataforma |
| src/app/api/ai/campaign/route.ts | Confiabilidade da IA, SEO e leitura pública |
| src/app/api/ai/marketing-copilot/route.ts | Confiabilidade da IA, SEO e leitura pública |
| src/app/api/ai/optimize/route.ts | Confiabilidade da IA, SEO e leitura pública |
| src/app/api/ai/product-draft/route.ts | Confiabilidade da IA, SEO e leitura pública |
| src/app/api/ai/product-tools/route.ts | Confiabilidade da IA, SEO e leitura pública |
| src/app/api/ai/seo-apply/route.ts | Confiabilidade da IA, SEO e leitura pública |
| src/app/api/ai/seo-audit/route.ts | Confiabilidade da IA, SEO e leitura pública |
| src/app/api/aluno/conteudos/[contentId]/acessar/route.ts | Consolidar correções e apresentação da plataforma |
| src/app/api/checkout/route.ts | Consolidar correções e apresentação da plataforma |
| src/app/api/creator-clubs/route.ts | Consolidar correções e apresentação da plataforma |
| src/app/api/creator/woocommerce/catalog/route.ts | Módulos dos criadores e integrações já implementados |
| src/app/api/creator/woocommerce/route.ts | Módulos dos criadores e integrações já implementados |
| src/app/api/creator/woocommerce/sync/route.ts | Módulos dos criadores e integrações já implementados |
| src/app/api/cron/abandoned-cart-reminders/route.ts | Módulos dos criadores e integrações já implementados |
| src/app/api/cron/favorite-price-alerts/route.ts | Consolidar correções e apresentação da plataforma |
| src/app/api/dashboard/clientes/reenvio-acesso/route.ts | Consolidar correções e apresentação da plataforma |
| src/app/api/integrations/store-chatbot/route.ts | Consolidar correções e apresentação da plataforma |
| src/app/api/produtos/post.ts | Consolidar correções e apresentação da plataforma |
| src/app/api/produtos/put.ts | Consolidar correções e apresentação da plataforma |
| src/app/api/produtos/route.ts | Consolidar correções e apresentação da plataforma |
| src/app/api/storage/presign-upload/route.ts | Uploads, imagens e acesso aos arquivos |
| src/app/api/storage/public-image/route.ts | Uploads, imagens e acesso aos arquivos |
| src/app/api/storage/public-media/route.ts | Uploads, imagens e acesso aos arquivos |
| src/app/api/storage/upload-image/route.ts | Uploads, imagens e acesso aos arquivos |
| src/app/buscar/page.tsx | Consolidar correções e apresentação da plataforma |
| src/app/cadastro/layout.tsx | Consolidar correções e apresentação da plataforma |
| src/app/carrinho/layout.tsx | Consolidar correções e apresentação da plataforma |
| src/app/categorias/[slug]/page.tsx | Consolidar correções e apresentação da plataforma |
| src/app/dashboard/afiliacoes/vitrine/page.tsx | Consolidar correções e apresentação da plataforma |
| src/app/dashboard/clube/page.tsx | Consolidar correções e apresentação da plataforma |
| src/app/dashboard/ia/MarketingCopilot.tsx | Consolidar correções e apresentação da plataforma |
| src/app/dashboard/ia/page.tsx | Consolidar correções e apresentação da plataforma |
| src/app/dashboard/kits/novo/page.tsx | Consolidar correções e apresentação da plataforma |
| src/app/dashboard/loja/page.tsx | Consolidar correções e apresentação da plataforma |
| src/app/dashboard/produtos/SeoAuditCards.tsx | Confiabilidade da IA, SEO e leitura pública |
| src/app/dashboard/produtos/novo/page.tsx | Consolidar correções e apresentação da plataforma |
| src/app/dashboard/produtos/page.tsx | Consolidar correções e apresentação da plataforma |
| src/app/dashboard/woocommerce/page.tsx | Módulos dos criadores e integrações já implementados |
| src/app/disciplinas/[slug]/page.tsx | Consolidar correções e apresentação da plataforma |
| src/app/entrar/page.tsx | Consolidar correções e apresentação da plataforma |
| src/app/fonts/OFL.txt | Consolidar correções e apresentação da plataforma |
| src/app/globals.css | Consolidar correções e apresentação da plataforma |
| src/app/imagens/produtos/[slug]/capa/route.ts | Uploads, imagens e acesso aos arquivos |
| src/app/kit/[id]/page.tsx | Consolidar correções e apresentação da plataforma |
| src/app/layout.tsx | Consolidar correções e apresentação da plataforma |
| src/app/login/page.tsx | Consolidar correções e apresentação da plataforma |
| src/app/loja/[slug]/PublicStoreClientView.tsx | Consolidar correções e apresentação da plataforma |
| src/app/loja/[slug]/checkout/CheckoutClientView.tsx | Consolidar correções e apresentação da plataforma |
| src/app/loja/[slug]/checkout/sucesso/[orderId]/OrderSuccessClientView.tsx | Consolidar correções e apresentação da plataforma |
| src/app/loja/[slug]/kit/[id]/KitDetailClientView.tsx | Confiabilidade da IA, SEO e leitura pública |
| src/app/loja/[slug]/layout.tsx | Consolidar correções e apresentação da plataforma |
| src/app/loja/[slug]/page.tsx | Consolidar correções e apresentação da plataforma |
| src/app/loja/[slug]/produto/[produtoSlug]/ProductDetailClientView.tsx | Confiabilidade da IA, SEO e leitura pública |
| src/app/loja/[slug]/produto/[produtoSlug]/page.tsx | Consolidar correções e apresentação da plataforma |
| src/app/loja/[slug]/themes/ThemeDefault.tsx | Consolidar correções e apresentação da plataforma |
| src/app/loja/[slug]/themes/ThemeLinkTree.tsx | Consolidar correções e apresentação da plataforma |
| src/app/loja/[slug]/themes/ThemeMinimalist.tsx | Consolidar correções e apresentação da plataforma |
| src/app/loja/[slug]/themes/ThemeNetflix.tsx | Consolidar correções e apresentação da plataforma |
| src/app/loja/[slug]/themes/ThemePinterest.tsx | Consolidar correções e apresentação da plataforma |
| src/app/lojas/page.tsx | Consolidar correções e apresentação da plataforma |
| src/app/offline/layout.tsx | Consolidar correções e apresentação da plataforma |
| src/app/page.tsx | Consolidar correções e apresentação da plataforma |
| src/app/produto/[slug]/page.tsx | Consolidar correções e apresentação da plataforma |
| src/app/redefinir-senha/layout.tsx | Consolidar correções e apresentação da plataforma |
| src/app/redefinir-senha/page.tsx | Consolidar correções e apresentação da plataforma |
| src/app/seguranca/page.tsx | Consolidar correções e apresentação da plataforma |
| src/app/sitemap.ts | Consolidar correções e apresentação da plataforma |
| src/components/FeaturedMonthlyCampaign.tsx | Confiabilidade da IA, SEO e leitura pública |
| src/components/Footer.tsx | Consolidar correções e apresentação da plataforma |
| src/components/HomepageMarketplace.tsx | Consolidar correções e apresentação da plataforma |
| src/components/MainBannersCarousel.tsx | Confiabilidade da IA, SEO e leitura pública |
| src/components/MarketplaceHeader.tsx | Consolidar correções e apresentação da plataforma |
| src/components/ProductCard.tsx | Consolidar correções e apresentação da plataforma |
| src/components/UpcomingCalendarDates.tsx | Consolidar correções e apresentação da plataforma |
| src/components/aluno/StudentHeader.tsx | Consolidar correções e apresentação da plataforma |
| src/components/dashboard/AffiliateSidebar.tsx | Consolidar correções e apresentação da plataforma |
| src/components/dashboard/FileUpload.tsx | Uploads, imagens e acesso aos arquivos |
| src/components/dashboard/ProductWizardModal.tsx | Consolidar correções e apresentação da plataforma |
| src/components/dashboard/Sidebar.tsx | Consolidar correções e apresentação da plataforma |
| src/components/exclusive-material/ExclusiveMaterialPanel.tsx | Consolidar correções e apresentação da plataforma |
| src/components/store/CartContext.tsx | Módulos dos criadores e integrações já implementados |
| src/components/store/ProductPublicSummary.tsx | Consolidar correções e apresentação da plataforma |
| src/components/store/StoreAnalytics.tsx | Consolidar correções e apresentação da plataforma |
| src/lib/ai-provider.ts | Confiabilidade da IA, SEO e leitura pública |
| src/lib/ai-service.ts | Confiabilidade da IA, SEO e leitura pública |
| src/lib/cart-service.ts | Módulos dos criadores e integrações já implementados |
| src/lib/catalog-seo.ts | Confiabilidade da IA, SEO e leitura pública |
| src/lib/catalog-sitemap.ts | Consolidar correções e apresentação da plataforma |
| src/lib/creator-club-service.ts | Consolidar correções e apresentação da plataforma |
| src/lib/discipline-service.ts | Consolidar correções e apresentação da plataforma |
| src/lib/exclusive-material-notification-service.ts | Consolidar correções e apresentação da plataforma |
| src/lib/mail-service.ts | Confiabilidade da IA, SEO e leitura pública |
| src/lib/object-storage-client.ts | Uploads, imagens e acesso aos arquivos |
| src/lib/object-storage.ts | Uploads, imagens e acesso aos arquivos |
| src/lib/order-service.ts | Consolidar correções e apresentação da plataforma |
| src/lib/product-delivery-files.ts | Consolidar correções e apresentação da plataforma |
| src/lib/product-read-service.ts | Consolidar correções e apresentação da plataforma |
| src/lib/product-seo-score.ts | Confiabilidade da IA, SEO e leitura pública |
| src/lib/product-write-service.ts | Consolidar correções e apresentação da plataforma |
| src/lib/sale-notification-service.ts | Consolidar correções e apresentação da plataforma |
| src/lib/search-matching.ts | Consolidar correções e apresentação da plataforma |
| src/lib/search-service.ts | Consolidar correções e apresentação da plataforma |
| src/lib/seo-public-catalog.ts | Confiabilidade da IA, SEO e leitura pública |
| src/lib/seo.ts | Confiabilidade da IA, SEO e leitura pública |
| src/lib/social-links.ts | Consolidar correções e apresentação da plataforma |
| src/lib/store-chatbot-catalog-search.ts | Consolidar correções e apresentação da plataforma |
| src/lib/store-chatbot-n8n-workflow.ts | Consolidar correções e apresentação da plataforma |
| src/lib/store-service.ts | Consolidar correções e apresentação da plataforma |
| src/lib/student-purchase-service.ts | Consolidar correções e apresentação da plataforma |
| src/lib/supabase.ts | Consolidar correções e apresentação da plataforma |
| src/lib/woocommerce-media.ts | Módulos dos criadores e integrações já implementados |
| src/lib/woocommerce-service.ts | Módulos dos criadores e integrações já implementados |
| src/proxy.ts | Consolidar correções e apresentação da plataforma |
| tests/e2e/public-mobile.spec.ts | Validação, diagnóstico ou ferramenta de manutenção |
| vite.config.mts | Runtime, dependências, cache e entrega na Cloudflare |
