# SEO e medição: auditoria e fechamento de 18/10/2026

## Resultado desta rodada

Auditoria HTTP de 59 URLs públicas observadas no relatório anterior do Search Console, incluindo as páginas de maior exposição, home, páginas editoriais e rotas intencionalmente excluídas. Todas responderam 200 após seguir redirecionamentos. Essa contagem não é uma auditoria de todo o catálogo nem prova de indexação.

Das 59 respostas, 52 documentos com `index, follow` tinham um H1 e title, description e canonical preenchidos. A variante PLR de um produto aponta ao mesmo canonical do material original, como previsto. Seis URLs são login, cadastro, carrinho ou busca filtrada e continuam em noindex. A restante era um alias UUID com redirecionamento por meta refresh; o destino tinha H1 e conteúdo normal. Ele passa a responder 301 no Worker, sem consultar banco nem renderizar a página de origem.

Não foram alterados nomes, slugs, descrições, imagens ou outros dados cadastrados pelos criadores. Alguns títulos continuam maiores que 60 caracteres porque o próprio nome cadastrado é extenso; não se cortou o nome nem se substituiu por um texto inventado.

## Indexação e Google

Consulta autenticada realizada em 18/10. O relatório de Páginas do Google está atualizado apenas até 11/10; os números abaixo não descrevem o resultado das alterações de hoje.

| Item | Evidência | Tratamento |
| --- | --- | --- |
| Desempenho de 10 a 16/10 | 84 cliques, 2.550 impressões, CTR 3,3%, posição média 5,9 | Referência de período, sem prometer efeito imediato ou primeira posição |
| Sitemap no Search Console | Processado, 378 páginas, última leitura 17/10 | Preservado; a resposta HTTP atual do sitemap tem 389 URLs, snapshot diferente do Google |
| Sitemap e robots em produção | Ambos HTTP 200 | Nenhum desbloqueio de áreas privadas |
| Indexadas / não indexadas | 441 / 324 | Dados do relatório de 11/10 |
| Noindex | 194 URLs | Não remover indiscriminadamente: há páginas privadas, filtros e páginas sem conteúdo suficiente |
| Alternativa com canonical adequado | 13 URLs | Exclusão da variante pode ser correta; canonical não significa que ambas devam indexar |
| Redirecionamento | 7 URLs | Não classificar toda migração ou normalização de host como erro |
| Cópia sem canonical selecionado | 3 exemplos: buscas por Educação no Trânsito e Proclamação da República, mais `/aluno/login` | Hoje as buscas têm canonical `/buscar` e noindex/follow; login tem noindex/nofollow. Nenhum deve ser promovido ao índice |
| 404 | `/produto/kit-das-caixinhas-da-alfabetizacao-yvy5` | Já responde 308 para a URL publicada; destino 200, canonical próprio e H1. Acionada **Validar correção**, confirmada como **Iniciado em 18/10/2026** |
| Bloqueada por robots | `/cliente/login?from=doce-aprender-pedagogico-plr` | Login: bloqueio esperado. Não liberar para rastreamento |
| Rastreada, não indexada | 20 URLs | A categoria do relatório não prova defeito técnico; depende de avaliação individual e nova decisão do Google |
| Detectada, não indexada | 85 URLs, validação já iniciada | Não reiniciar nem simular aprovação |

`/loja/hyper-light` e `/categorias/outros` continuam noindex/follow. URL de produto inexistente testada respondeu **404** com noindex. Home mantém canonical canônico e H1 único. O alias UUID corrigido é `f08965bd-960b-4e4b-960a-782f663909d1`; o destino é exatamente o slug já publicado do mesmo material, sem alteração no banco.

Não foram feitas solicitações de indexação em massa nem uso de Remover URLs, Alteração de endereço, Exclusão de propriedade ou mudanças de permissões.

## Medição corrigida

- A rota canônica `/produto/[slug]` passa a carregar o componente de métricas da própria loja, usando IDs já cadastrados e o consentimento existente. Não se configurou uma propriedade GA4 nova em nome dos criadores.
- Eventos de produto no GA4 passam a incluir `items`, `item_id`, `item_name`, `price`, `quantity`, moeda e valor quando disponíveis. Eventos enviados explicitamente usam `send_to` para o ID da loja.
- Eventos explícitos do Meta usam `trackSingle`, inclusive o PageView inicial, para evitar broadcast a todos os pixels inicializados numa navegação entre lojas.
- Uma fila limitada a 30 eventos, apenas em memória, conserva eventos recebidos durante o carregamento. Não há envio aos SDKs antes do aceite e da inicialização daquele destino. Recusar descarta a fila. Armazenamento bloqueado pelo navegador não quebra a loja.
- A compatibilidade específica com Vinext foi conferida no shim instalado: inline `Script.onReady` ocorre antes da inserção do script. O envio é adiado por uma microtask, depois da criação da fila do SDK.
- Compra usa o ID e valor fornecidos pelo produtor atual do evento, sem alterar checkout ou pagamento. Deduplicação local por ID evita reenvio quando um SDK termina de iniciar depois do outro. Não se fabricam itens de compra: o evento existente de confirmação fornece total e ID, sem linhas do pedido.
- Campos arbitrários, email e outros dados de cliente não são repassados por este emissor. Consentimento de uma loja não é herdado por outra.

Referências técnicas: [ecommerce GA4](https://developers.google.com/analytics/devguides/collection/ga4/ecommerce), [roteamento por send_to](https://developers.google.com/tag-platform/gtagjs/routing). A prontidão significa entrega à fila do SDK; bloqueador de anúncios, rede, falta de consentimento e configuração externa ainda podem impedir o recebimento nas plataformas. Não é recuperação retroativa de eventos perdidos nem garantia de atribuição.

## Entrega de imagens e consumo

A prévia MinIO inspecionada respondeu 200, 29.838 bytes e `Cache-Control: public, max-age=31536000, immutable`. Os testes de regressão confirmam entrega direta, manifesto de prévias verificadas, preservação do original e arquivos privados, lazy loading abaixo da dobra e ausência de transformação paga. A auditoria de tempo HTTP não é uma medição de Core Web Vitals. Não se declara aprovação de CWV sem dados de campo.

Nenhum binding, storage ou serviço pago novo. Nenhuma alteração em RLS, tenant, preços, Asaas, regras de compra ou webhooks.

## Verificação

- `npm run lint`: zero erros, 17 avisos existentes fora dos arquivos desta rodada.
- `npm run typecheck:vinext` e `npm run test:source-size`.
- `npm run test:store-analytics`: fila, atraso dos SDKs, consentimento, troca de loja, armazenamento bloqueado, payload GA4, destino, deduplicação, limite de memória e SDK bloqueado. Inclui ciclo do componente com scripts inertes, sem enviar compras de teste a contas reais.
- `npm run test:product-growth`, `node scripts/verify-search-opportunities.cjs`, `node scripts/verify-minio-image-performance.cjs` e `npm run test:cloudflare-free`.
- Build de produção Vinext e empacotamento Wrangler: `node scripts/deploy-cloudflare.mjs --dry-run`. Publicação pelo pipeline Git existente, sem duplicar deploy manual.

## Arquivos alterados

| Arquivo | Motivo |
| --- | --- |
| `src/lib/store-analytics-events.ts` | Normalização dos eventos, payloads por plataforma, fila e destinos da loja |
| `src/components/store/StoreAnalytics.tsx` | Consentimento seguro, escuta antecipada e inicialização compatível com Vinext |
| `src/app/produto/[slug]/page.tsx` | Métricas da loja também na página canônica de produto |
| `scripts/verify-store-analytics.cjs` | Regressões funcionais e ciclo do componente, sem tráfego real aos SDKs |
| `package.json` | Comando reproduzível `test:store-analytics` |
| `src/lib/legacy-product-urls.ts` | 301 antes de renderizar para um alias UUID confirmado |
| `scripts/verify-search-opportunities.cjs` | Verificar todas as correspondências e informar a contagem real |
| `ops/SEO-FECHAMENTO-AUDITORIA-2026-10-18.md` | Evidências, escopo, arquivos e limites desta rodada |

## O que continua dependendo de fatos e de terceiros

O trabalho técnico desta rodada pode ser encerrado; SEO não tem um estado definitivo de “nada mais a fazer”. Os criadores precisam revisar os dados reais dos próprios materiais, cadastrar amostras que possam publicar, responder dúvidas e usar os links de campanha corretos. Não podemos confirmar conteúdo do arquivo, direito de uso ou público indicado por suposição. Avaliações devem vir de compradores reais; não há geração de depoimentos nem compra de links.

O Google precisa rastrear, processar as correções e decidir quais páginas exibir e em qual posição. Publicação, nota interna 100/100 e solicitação de indexação não garantem primeiro lugar. A propriedade GA4 da Educalizando ainda precisa ser identificada/autorizada para confirmar relatórios externos; a classificação local de pedidos não transforma origem desconhecida em Google orgânico.
