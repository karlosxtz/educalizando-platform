# GA4, conteúdo útil e velocidade — 18/10/2026

## Medição própria

- Conta GA4 **Educalizando**, ID `412364892`.
- Propriedade **Educalizando - site e vendas**, ID `559484516`.
- Fluxo Web **Educalizando - site oficial**, ID `16154863843`.
- Identificador público de medição: `G-39R0YCQBJS` (não é segredo).
- URL do fluxo: `https://www.educalizando.com.br`; moeda BRL; fuso de São Paulo.
- Compartilhamentos opcionais da conta desmarcados. Medição otimizada desativada, sem captura automática de formulários. Código não habilita Google Signals nem personalização de anúncios.
- Termos brasileiros e de tratamento de dados aceitos com autorização expressa. Ativação do envio de visitas, campanhas e totais de compras autorizada separadamente pelo responsável, com consentimento do visitante.

O código só carrega a tag própria após aceitar as métricas da plataforma. Há recusa e reabertura das preferências nas páginas públicas. A escolha da plataforma é independente da escolha de métricas de cada loja; uma não concede consentimento à outra. Visitantes que entram diretamente em uma loja não recebem um segundo aviso automático da plataforma, mas podem abrir as preferências. Isso limita a cobertura e evita interpretar ausência de evento como ausência de venda.

Há uma lista explícita de páginas públicas elegíveis. Painel, admin, aluno, login, APIs e checkout não geram page_view. Na confirmação de compra, somente o evento Purchase já emitido após status pago pode ser encaminhado com consentimento prévio. A integração não muda consulta de pagamento, entrega, Asaas ou regras de acesso.

Parâmetros de URL e fragmentos não são enviados em page_location. Referência contém somente a origem do site, sem caminho ou busca. Campanhas usam uma lista restrita de campos e caracteres. O evento de compra transmite identificador interno, valor e moeda; não transmite nome, e-mail, CPF, endereço, cartão ou link de acesso. Cada chamada tem `send_to` explícito da plataforma. Eventos das lojas continuam destinados às respectivas contas.

**Limites:** só há medição a partir da ativação e do consentimento. Não reconstitui a origem de compras antigas. O produtor atual do evento Purchase fornece total e ID, sem itens; esta entrega não inventa itens nem altera o checkout para obtê-los. A receita agregada e o evento precisam ser conferidos quando ocorrer a próxima compra real consentida; relatórios de itens comprados não estão completos com esse contrato. Bloqueadores, recusa, saída antes da confirmação e falhas de rede podem reduzir a medição. Não foi enviada compra fictícia à propriedade real.

Documentação técnica: [configuração do GA4](https://developers.google.com/analytics/devguides/collection/ga4/reference/config) e [e-commerce](https://developers.google.com/analytics/devguides/collection/ga4/ecommerce). Monitorar aquisição de tráfego, origens/mídias, páginas de entrada e purchase; não comparar estes primeiros dias com períodos anteriores como se houvesse cobertura igual.

## Imagens no MinIO

Foram preparadas localmente e enviadas ao bucket público existente 57 prévias WebP, sem substituir os originais:

| Conjunto | Prévias | Originais somados | Prévias somadas |
| --- | ---: | ---: | ---: |
| Novas capas e imagens do catálogo | 15 | 1.709.340 bytes | 365.936 bytes |
| Galerias dos produtos prioritários | 42 | 19.322.044 bytes | 1.982.180 bytes |
| Total | 57 | 21.031.384 bytes | 2.348.116 bytes |

Redução de aproximadamente **89% nesses arquivos**, não de 89% do site inteiro. As 57 URLs responderam 200, com tipo imagem, tamanho esperado e Cache-Control contendo max-age=31536000, antes de entrar no manifesto. O catálogo usa somente prévias verificadas e preserva fallback no endereço original. As galerias principais mantêm as imagens originais; suas miniaturas passam a usar as prévias.

Nenhum processamento de imagem foi acrescentado ao Worker. Os bytes continuam vindo diretamente do MinIO. Nenhum arquivo privado, material comprado, política de acesso, bucket ou transformação paga foi alterado. Novos uploads dos criadores continuam usando a arquitetura existente. O script de manutenção ganhou `--sources lista.json` para preparar apenas URLs públicas selecionadas, sem inventário completo a cada execução.

A primeira imagem do produto também ganhou prioridade explícita, dimensões e exibição sem a animação inicial de opacidade, preservando a transição entre imagens posteriores.

## Conteúdo editorial

Oito páginas existentes receberam um exemplo de planejamento em três etapas e uma orientação de observação: materiais didáticos, alfabetização, Educação Infantil, imprimir, jogos pedagógicos, Ensino Fundamental, planos de aula e recursos pedagógicos. São Server Components, sem novas consultas ou rotas. A interface distingue orientações da plataforma do conteúdo oferecido em cada produto e não certifica BNCC.

A revisão das dez páginas está em [SEO-REVISAO-DEZ-PAGINAS-2026-10-18.md](SEO-REVISAO-DEZ-PAGINAS-2026-10-18.md), incluindo duas divergências de quantidade a conferir com o criador. Nenhum cadastro foi alterado.

## Medidas de laboratório antes da publicação

| Página, celular | Desempenho | SEO técnico Lighthouse | LCP | CLS | Bloqueio da thread |
| --- | ---: | ---: | ---: | ---: | ---: |
| Home | 80 | 100 | 4,2 s | 0 | 0 ms |
| Cabelo Maluco Carrinho | 70 | 100 | 5,6 s | 0 | 0 ms |

Testes PageSpeed de 18/10, Moto G Power emulado, 4G lento. São medidas de laboratório variáveis; não há dados CrUX suficientes nessa consulta e nota técnica 100 não é posição no Google. Relatórios: [home](https://pagespeed.web.dev/analysis/https-www-educalizando-com-br/m4wdpfuypz?form_factor=mobile) e [produto](https://pagespeed.web.dev/analysis/https-www-educalizando-com-br-produto-cabelo-maluco-carrinho-de-corrida-pdf-educacao-infantil-e-fundamental/v9uj874vka?form_factor=mobile).

## Validação local

Lint: zero erros, 17 avisos preexistentes. Typecheck Vinext aprovado. Build de produção real com o script do projeto e empacotamento Wrangler em dry-run aprovado. A primeira tentativa de build esbarrou em acesso negado local numa dependência; a execução autorizada fora da restrição concluiu.

Testes aprovados: plataforma GA4 (inclusive ciclo do componente, consentimento, recusa, SDK tardio, destinos e rotas privadas), integrações das lojas, crescimento de produtos, oportunidades de busca, qualidade SEO, guias editoriais, cache/entrega Cloudflare, imagens MinIO, seleção e limite de tamanho dos fontes.

## Arquivos alterados e motivos

| Arquivo | Motivo |
| --- | --- |
| `src/lib/platform-analytics.ts` | Contrato restrito de eventos, destinos, rotas e dados públicos de medição. |
| `src/components/PlatformAnalytics.tsx` | Consentimento independente, carregamento condicional da tag, preferências e escuta dos eventos existentes. |
| `src/app/layout.tsx` | Montar a integração em Suspense sem mudar as páginas. |
| `src/app/privacidade/page.tsx` | Explicar medição opcional, dados tratados e como recusar. |
| `scripts/verify-platform-analytics.cjs` | Regressões de privacidade, inicialização, deduplicação e renderização dos guias. |
| `src/lib/minio-preview-manifest.json` | Habilitar somente as 57 novas prévias verificadas. |
| `scripts/optimize-minio-previews.mjs` | Aceitar lista pública direcionada para manutenção local. |
| `src/app/loja/[slug]/produto/[produtoSlug]/ProductDetailClientView.tsx` | Priorizar a primeira imagem e evitar atraso visual de opacidade. |
| `src/lib/intent-classroom-examples.ts` | Oito exemplos úteis e distintos, separados dos anúncios. |
| `src/components/seo/IntentClassroomGuide.tsx` | Renderização acessível dos exemplos no servidor. |
| `src/components/seo/IntentLandingPage.tsx` | Incluir o guia nas páginas existentes. |
| `ops/SEO-REVISAO-DEZ-PAGINAS-2026-10-18.md` | Rascunhos factuais para revisão dos criadores. |
| `ops/GA4-CONTEUDO-VELOCIDADE-2026-10-18.md` | Evidências, limites, entrega e validações desta etapa. |
