# Correção da home sem materiais — 19/10/2026

## Causa comprovada

A API pública retornou `PGRST201`: a relação `products → stores` passou a ser ambígua após a criação de `store_conversion_events`, cujo par de chaves estrangeiras também permite ao PostgREST inferir um relacionamento muitos-para-muitos. As consultas antigas `store:stores(...)` não escolhiam a relação desejada. O fallback vazio foi persistido no ISR e deixou hero, banners e prateleiras sem produtos.

As consultas corrigidas especificam `products_store_id_fkey`, mantendo a loja proprietária e os mesmos filtros de publicação, exclusão e autorização. A consulta pública real passou a retornar 294 produtos publicados e 6 gratuitos no momento da validação. Esses números não são totais de cadastros privados ou rascunhos.

## Alterações por arquivo

| Arquivo | Motivo |
|---|---|
| `src/lib/product-read-service.ts` | Desambiguar catálogo geral, gratuitos e PLR. |
| `src/lib/discovery-catalog.ts` | Corrigir marketplace e galeria de vídeos. |
| `src/lib/affiliate-service.ts` | Mesma correção nas consultas de produtos disponíveis e aprovados; sem mudar regras de afiliação. |
| `src/lib/product-review-write.ts` | Manter a validação da loja proprietária ao enviar avaliação. |
| `src/app/aluno/(protected)/favoritos/page.tsx` | Desambiguar a loja no produto favorito. |
| `src/app/api/customer/followed-stores/route.ts` | Corrigir a loja dos novos produtos de lojas seguidas. |
| `src/app/api/produtos/route.ts` | Manter o vínculo com o criador na consulta autenticada. |
| `src/app/api/materiais-gratis/route.ts` | Corrigir leitura dos brindes sem alterar elegibilidade. |
| `src/app/api/plr/purchases/route.ts` | Corrigir dados da loja no material comprado. |
| `src/app/api/cron/favorite-price-alerts/route.ts` | Corrigir leitura do slug da loja no alerta existente. |
| `src/app/api/affiliates/applications/route.ts` | Corrigir leitura da loja do produto, preservando autorização. |
| `src/app/api/admin/products/route.ts` | Corrigir listagem administrativa de produtos. |
| `src/app/api/admin/stores/route.ts` | Desambiguar a contagem reversa de produtos por loja. |
| `src/app/api/admin/whatsapp-networking/route.ts` | Desambiguar a contagem reversa existente, sem enviar mensagens. |
| `src/app/page.tsx` | Evitar que o ISR persista um fallback vazio; HTML saudável continua usando o cache público do Worker. |
| `src/components/HomepageMarketplace.tsx` | Identificar explicitamente se o catálogo carregou. |
| `cloudflare/public-page-cache.js` | Não armazenar a home quando o catálogo estiver indisponível. |
| `scripts/verify-home-catalog-relations.cjs` | Reproduzir ambiguidade e conferir relação correta, capas e campos públicos. |
| `scripts/verify-public-page-cache.mjs` | Conferir falha sem cache e recuperação na próxima resposta saudável. |
| `ops/HOME-CATALOGO-CORRECAO-2026-10-19.md` | Registrar diagnóstico e arquivos. |

Não há nova migration. Nenhuma política RLS, dado, preço, regra de checkout, Asaas, webhook ou armazenamento de imagem foi alterado. As imagens continuam na infraestrutura MinIO existente.
