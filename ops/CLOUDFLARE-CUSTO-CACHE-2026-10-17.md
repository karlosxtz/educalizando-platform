# Cloudflare: consumo, entrega e operação — 17/10/2026

Implementação preparada e validada por build/dry-run. Esta etapa não publica o Worker, não ativa regras no painel, não muda plano e não escreve em cadastros. O armazenamento continua no MinIO e os dados continuam no Supabase externo.

**Limite do objetivo:** reduzir consumo não garante uma fatura de US$5. A franquia é compartilhada por conta e há cobrança excedente. Alertas avisam, não interrompem uso. Cache hits de HTML ainda invocam o Worker; um bloqueio feito dentro do Worker também conta como invocação. Um teto financeiro absoluto exige interromper serviços/tráfego antes da franquia acabar, com impacto de disponibilidade, ou mudar a hospedagem; isso não foi feito automaticamente.

**Exceção de entrega preservada:** PDFs licenciados são identificados com dados do comprador no Worker. Remover essa etapa alteraria a proteção e a entrega do aluno. Ela foi mantida. Os demais arquivos MinIO continuam com URL assinada temporária, sem cache, e transferência direta do armazenamento. O pedido de retirar absolutamente todos os bytes de materiais do Worker não é compatível com preservar esse processamento de PDF dentro da arquitetura atual.

## Arquitetura encontrada

- Vinext 1.1 / Vite, com convenções App Router do Next 16. Sem OpenNext e sem Cloudflare Pages.
- Entrada `cloudflare/worker.js`; fonte de configuração `cloudflare.config.ts` e `vite.config.mts`.
- Não há wrangler.toml/jsonc na raiz. `scripts/deploy-cloudflare.mjs` gera `.cloudflare/output/v0/workers/default/wrangler.deploy.json` a partir do build.
- Binding `ASSETS`: arquivos estáticos. Binding `VINEXT_KV_CACHE`: cache existente do Vinext. Nenhum R2, D1 ou Durable Object foi criado.
- Antes: havia `IMAGES`, usado em transformação de upload/importação. Depois: binding removido e adaptador Cloudflare recusa transformação paga. No navegador, a compressão local já existente continua. Fluxos legados preservam bytes e MIME originais quando a transformação não está disponível; buckets, chaves, credenciais e política de acesso não mudam.
- O cron de minuto em minuto foi preservado: processa importações e entrega de webhooks. Em 30 dias são 43.200 execuções agendadas, cujo CPU precisa entrar no acompanhamento.

## Caminhos de imagens e downloads

| Caminho | Antes | Depois |
|---|---|---|
| Capas, logos, banners com URL pública MinIO | Alguns componentes convertiam para `/media/catalogo/*` | Componentes resolvem diretamente `https://arquivos.educalizando.com.br/public-images/uploads/...` |
| `/media/catalogo/*` antigo | Worker buscava e transmitia os bytes, mesmo com cache local | Somente 301 para o mesmo objeto público, sem fetch do arquivo |
| `/api/storage/public-image` antigo | Worker podia consultar MinIO e transmitir imagem | Somente redirecionamento validado; API permanece sem cache |
| `/api/storage/public-media` com imagem reconhecida | Worker transmitia imagem | Redirecionamento; vídeos legados preservam o fluxo existente |
| `/imagens/produtos/[slug]/capa` | Consulta do produto e, em alguns casos, leitura completa do arquivo | Só consulta pública e redirecionamento; metadata, sitemap e resumo novos já usam o URL direto |
| `/_next/static/*`, fontes, branding | Assets nativos já existentes | Assets-first explícito; estáticos não entram no render da aplicação |
| Upload comum | Navegador comprime e envia diretamente ao MinIO após autorização | Preservado, inclusive renovação automática da autorização |
| Downloads pagos não PDF | API valida acesso e entrega link assinado MinIO | Preservado; assinatura de 15 minutos e resposta `private, no-store` reforçada |
| PDF licenciado | Autorização, leitura, identificação do comprador, resposta privada | Preservado integralmente: ainda consome Worker/CPU |

Referências externas cadastradas pelos criadores não foram movidas ou regravadas. SVGs públicos legados/importados podem ser redirecionados ao host de arquivos; não são executados ou transmitidos no domínio da aplicação. A validação atual de novos uploads de SVG não foi relaxada.

Até as regras de redirecionamento abaixo serem ativadas, **a primeira requisição de uma URL antiga ainda invoca o Worker para receber o redirect**. Os bytes da imagem já não passam por ele. Não confundir esses dois fatos. Imagens novas e referências renderizadas normalizadas vão diretamente ao host de arquivos.

## Cache e revalidação implementados

| Documento | Política preparada |
|---|---|
| Home, lojas, produtos, categorias e sitemap | Revalidação de 3.600 segundos e cache de documento público por 1h |
| HTML/XML público elegível | Cache API por região, validade de 1h e janela stale de 300s, com atualização em segundo plano |
| Visitante com Cookie/Authorization, query string, Range ou navegação RSC | Bypass do cache de documentos; sessão/RSC recebe política privada |
| Dashboard, aluno/cliente, API, login, checkout, autenticação | `private, no-store`; não entram no cache público |
| `/_next/static/*` | 1 ano e `immutable`, pois os nomes têm hash |
| `/branding/*` | 1 dia; nomes fixos não receberam `immutable` indiscriminadamente |
| Imagens MinIO com chave própria por upload | Objeto já pede cache anual; a entrega atual acrescenta `no-cache`, exigindo a regra B abaixo |

O cache é sob demanda, compatível com o Vinext instalado. Não há exportação HTML de todo o catálogo nem promessa de que `generateStaticParams` de outro adaptador resolveria o runtime atual. A primeira visita/cache miss ainda renderiza. Hits não passam pelo render/proxy de existência nem repetem suas consultas Supabase.

Headers de documentos elegíveis incluem `s-maxage=3600` e `stale-while-revalidate=300`. `max-age=0, no-cache, must-revalidate` impede o navegador de conservar silenciosamente preços antigos. `CDN-Cache-Control: no-store` e `Cloudflare-CDN-Cache-Control: no-store` evitam uma segunda cópia independente de HTML no CDN: o TTL/SWR efetivo é controlado pela Cache API, com revisão de catálogo na chave. **Não criar uma regra Cache Everything para HTML.**

Após criar/editar/excluir produto pelas APIs padrão ou aplicar SEO pela IA, a aplicação invalida a tag pública e o cache do framework antes de trocar a revisão de HTML. A loja continua salvando pelo fluxo RLS atual; após sucesso, faz uma chamada autenticada ao novo endpoint `/api/cache/public-revalidate`. O endpoint verifica proprietário e limita frequência, sem aceitar caminhos arbitrários para purga. Layout, metadata e página compartilham a leitura da loja na mesma renderização.

A revisão fica no KV existente. KV é eventualmente consistente; a mudança pode levar cerca de 30–60 segundos, ou mais em uma falha de propagação, para chegar a todas as regiões. Não é uma garantia de atualização instantânea. O adaptador aguarda a fila real de invalidações do Vinext instalado, pois suas funções `revalidate*` retornam `void`. A revisão leva o instante da alteração: durante os primeiros 120 segundos, a nova revisão não preenche o cache de borda, evitando consolidar dados antigos enquanto as tags propagam. Respostas ISR marcadas `STALE` também nunca ganham uma nova hora de cache. Edições muito frequentes reduzem o benefício do cache nesse intervalo. Ao atualizar o Vinext, revalidar esse adaptador e seu teste de contrato. Salvamentos externos que não passam por esses pontos continuam dependendo do TTL ou de uma integração explícita com a invalidação. Não foram alterados contratos de webhook/checkout para adicionar novos efeitos.

Falha de KV não deve causar falso erro de cadastro: o dado salvo é preservado e a revalidação fica pendente. Falha de leitura da revisão faz bypass de HTML em vez de servir uma revisão possivelmente incorreta. Há apenas um retry de escrita para rate limit do KV, sem loop ilimitado. Não há novo polling de servidor ou navegador. Os timers de prazo de carregamento e debounce existentes não foram removidos como se fossem polling.

## Estimativa de operações apresentada antes de ativar

O código reutiliza o namespace existente, sem provisionar outro serviço:

- Controle de HTML: `P` leituras para `P` navegações elegíveis por mês; uma escrita por salvamento. Cache API não grava HTML em um novo KV.
- Nova invalidação da tag pública: aproximadamente mais uma gravação por salvamento, além das invalidações de paths que o Vinext já realiza.
- Um retry eventual da revisão pode acrescentar uma gravação tentada por salvamento. A chave global de revisão está sujeita ao limite de escrita por chave do KV; muitos salvamentos simultâneos podem deixar uma purga pendente.
- Exemplo incremental: 1 milhão de navegações e 10 mil salvamentos → cerca de 1 milhão de leituras + 20 mil gravações; com retry em todos os salvamentos, reservar até 30 mil tentativas de gravação. **Somar** ISR, tags, fetch cache e outros Workers da conta.
- Franquia KV paga: 10 milhões de leituras, 1 milhão de escritas/exclusões/listagens e 1 GB armazenado por mês. Acima da franquia, leituras custam US$0,50/milhão e escritas US$5/milhão. Esses valores não autorizam cobrança adicional.
- Cache de página reduz renderizações, mas uma purga global também deixa páginas frias. Quanto maior a frequência de edição, menor será a taxa de acerto. Medir em produção, não assumir redução fixa de 60 vezes.

Workers Paid: 10 milhões de requisições e 30 milhões de CPU-ms incluídos no mês, compartilhados por conta. A título de planejamento, se um HIT usasse 3 ms e um MISS 100 ms, 1 milhão de visitas com 95% de HIT consumiria aproximadamente 7,85 milhões de CPU-ms, antes de APIs, cron e PDFs. **Esses tempos são hipóteses, não medições desta plataforma.**

## Checklist manual no painel

### 1. Antes de publicar

- [ ] Confirmar Workers Paid na conta e conferir outros serviços que dividem as franquias. Workers de US$5 não inclui um upgrade do WAF da zona para Pro.
- [ ] Conferir Workers & Pages → educalizando-app → Settings → Domains & Routes. Somente os hosts da aplicação devem chamar esse Worker. Não rotear `arquivos.educalizando.com.br/*` nem `*.educalizando.com.br/*` para o Worker da aplicação. O host de arquivos deve continuar apontando ao MinIO atual.
- [ ] No DNS, manter o host de arquivos com proxy laranja se desejar Cache Rules/WAF nele, sem trocar seu destino de armazenamento.
- [ ] Usar o build/deploy do projeto. O Wrangler gerado deve conter `assets.run_worker_first: false`, `ASSETS`, o mesmo `VINEXT_KV_CACHE` e nenhum `images` binding.
- [ ] Não habilitar Image Transformations/Images ou um produto adicional de cache pago para realizar estas otimizações.

### 2. Cache Rules — zona educalizando.com.br

Criar em Rules → Cache Rules. Não usar TTL que ignore headers privados. As regras privadas devem prevalecer sobre regras antigas de cache amplo.

**A. Estáticos com hash — Eligible for cache; Edge e Browser TTL respeitam origem:**

```text
(http.host eq "www.educalizando.com.br" and starts_with(http.request.uri.path, "/_next/static/"))
```

**B. Imagens públicas no MinIO — Eligible for cache; override específico descrito abaixo:**

```text
(http.host eq "arquivos.educalizando.com.br" and starts_with(http.request.uri.path, "/public-images/uploads/") and http.request.uri.query eq "" and not any(http.request.headers["authorization"][*] ne ""))
```

**Achado na entrega real:** três imagens públicas foram verificadas por HEAD e responderam 200/WebP, porém com `Cache-Control: public, max-age=31536000, immutable, no-cache`. O `no-cache` adicional prejudica o reaproveitamento mesmo com o max-age anual. Não foram regravados objetos nem alterado o servidor MinIO.

Nesta regra B, configurar **Edge TTL → Ignore cache-control header and use this TTL → 1 day** e **Browser TTL → Override origin → 1 day**, restrito à expressão de imagens públicas acima. Para os status 400–499 e 500–599, selecionar **no-store** (TTL -1 na API), sem cachear falhas como imagens. A opção de override é documentada em [Cache Rules settings](https://developers.cloudflare.com/cache/how-to/cache-rules/settings/). Validar depois uma resposta 200 sem `no-cache` e, na segunda visita pela mesma região, `CF-Cache-Status: HIT`. Se houver outra regra de response headers acrescentando `no-cache`, removê-la somente nesse caminho público. Manter bypass para URLs assinadas, Authorization e materiais privados. Para novas chaves comprovadamente imutáveis, o Browser TTL pode ser anual; não aplicar essa duração a URLs sobrescritas. Nada foi regravado nesta tarefa.

**C. Áreas privadas e variantes — Bypass cache:**

```text
(http.host eq "www.educalizando.com.br"
 and not starts_with(http.request.uri.path, "/_next/static/")
 and (
   starts_with(http.request.uri.path, "/api/")
   or starts_with(http.request.uri.path, "/dashboard")
   or starts_with(http.request.uri.path, "/admin")
   or starts_with(http.request.uri.path, "/aluno")
   or starts_with(http.request.uri.path, "/cliente")
   or starts_with(http.request.uri.path, "/auth")
   or starts_with(http.request.uri.path, "/checkout")
   or http.request.uri.path contains "/checkout"
   or http.request.uri.path in {"/login" "/entrar" "/seguranca" "/redefinir-senha" "/carrinho"}
   or http.cookie ne ""
   or any(http.request.headers["authorization"][*] ne "")
   or any(http.request.headers["rsc"][*] eq "1")
   or http.request.uri.query ne ""
 ))
```

**D. Restante do host de arquivos — Bypass cache, principalmente links assinados:**

```text
(http.host eq "arquivos.educalizando.com.br" and
 (not starts_with(http.request.uri.path, "/public-images/uploads/") or http.request.uri.query ne "" or any(http.request.headers["authorization"][*] ne "")))
```

- [ ] Remover/desativar qualquer Cache Everything/Edge TTL amplo que force HTML da aplicação a ser cacheado fora da Cache API ou sobreponha `no-store`.
- [ ] Após publicar, fazer uma purga única do cache da zona para remover cópias antigas independentes. Não executar purga global em cada visita ou salvamento.

### 3. URLs legadas de imagens — sem bytes e, opcionalmente, sem invocação

- [ ] Para `/media/catalogo/*`, criar Single Redirect: hostname `www.educalizando.com.br`, caminho começando `/media/catalogo/uploads/`, método GET/HEAD, sem query (ou somente `image_retry=1`); destino dinâmico:

```text
concat("https://arquivos.educalizando.com.br/public-images", substring(http.request.uri.path, 15))
```

Status 301, não preservar query. Confirmar com Cloudflare Trace: `/media/catalogo/uploads/test.webp` deve virar `/public-images/uploads/test.webp`. O código ainda valida chaves para quem chegar ao fallback do Worker. Não criar regra genérica para buckets privados ou endpoints de autorização.

- [ ] Para URLs antigas de `/imagens/produtos/.../capa`, usar Bulk Redirect de URLs públicas exatas. O exportador `node scripts/export-public-image-redirects.mjs` só lê o catálogo público e gera `.cloudflare/public-image-redirects.csv` para as capas históricas. Nesta consulta foram exportadas 434 entradas de capa, incluindo slug e ID.
- [ ] Em Account → Bulk Redirects, importar o CSV sem cabeçalho, criar a lista e ativar uma Bulk Redirect Rule que use essa lista. Isso ocorre antes do Worker. Conferir limite disponível da conta. O CSV não ativa nada sozinho.
- [ ] O mapa de capas é uma fotografia: reexportar/revisar quando uma capa mudar. Não aplicar um mapeamento permanente que você não queira manter. As referências novas do site já usam a URL direta atual e não dependem dessa lista.
- [ ] Não colocar `/api/storage/public-image?bucket=...&key=...` nesse CSV: Bulk Redirects não diferencia fontes por query string. Essas URLs antigas conservam o redirecionamento validado por código, sem bytes de imagem, e ainda contam uma invocação se forem requisitadas. As páginas novas já não precisam delas. Uma regra dinâmica para queries exigiria validação de bucket, chave e codificação no Trace; não usar uma concatenação genérica que possa apontar para materiais privados.

### 4. Tráfego caro e bots

**Bot Fight Mode:** não ligar indiscriminadamente nesta zona: há Asaas, n8n, APIs e webhooks de máquina. Bot Fight Mode gratuito não pode ser pulado por uma regra Skip comum. Se optar por utilizá-lo, validar todas as integrações antes. Sem upgrade obrigatório: use as regras direcionadas abaixo. Se já houver Super Bot Fight Mode em outro plano, configurar exceções de integrações e bots verificados antes de habilitar desafios.

**Rate limit compatível com a zona Free:** Security → WAF/Security rules → Rate limiting. Uma regra, IP como característica, 60 requisições por 10 segundos, ação Block por 10 segundos. Ajustar o valor depois de observar tráfego legítimo/NAT. Não usar desafio JavaScript em JSON. Expressão somente com Path e Verified Bot, disponíveis no Free:

```text
((starts_with(http.request.uri.path, "/api/") or http.request.uri.path contains "/checkout"
   or http.request.uri.path eq "/" or starts_with(http.request.uri.path, "/produto/")
   or starts_with(http.request.uri.path, "/loja/") or starts_with(http.request.uri.path, "/categorias/"))
 and not starts_with(http.request.uri.path, "/api/webhooks/")
 and not starts_with(http.request.uri.path, "/api/integrations/")
 and not starts_with(http.request.uri.path, "/api/cron/")
 and not cf.client.bot)
```

O mesmo limite cobre varredura excessiva de HTML público para proteger cache misses de URLs inventadas; assets e imagens diretas ficam fora. Não aplicar este limite genérico aos callbacks excluídos; eles continuam com autenticação/validação da aplicação. Não inserir host, método ou headers na expressão do rate limit Free. Mais regras/períodos exigem verificar o plano da zona, não apenas Workers Paid.

**Scrapers conhecidos — Custom Rule, Managed Challenge apenas em HTML público:**

```text
(http.host eq "www.educalizando.com.br" and http.request.method in {"GET" "HEAD"}
 and not cf.client.bot
 and not (http.request.uri.path contains "/checkout")
 and (http.request.uri.path eq "/" or starts_with(http.request.uri.path, "/produto/")
      or starts_with(http.request.uri.path, "/loja/") or starts_with(http.request.uri.path, "/categorias/"))
 and (lower(http.user_agent) contains "bytespider" or lower(http.user_agent) contains "ahrefsbot"
      or lower(http.user_agent) contains "semrushbot" or lower(http.user_agent) contains "mj12bot"
      or lower(http.user_agent) contains "dotbot"))
```

Não confiar só no texto Googlebot/Bingbot do User-Agent: a isenção usa `cf.client.bot`. Bots verificados não entram nos desafios; a regra não detecta todo scraper. Não bloquear todos os data centers/ASNs ou países para tentar adivinhar bots. Sondagens de `.env`, `.git` e WordPress já têm rejeição barata por código, sem executar o framework.

**Hotlink — Custom Rule, Block, somente imagens públicas do host de arquivos:**

```text
(http.host eq "arquivos.educalizando.com.br"
 and starts_with(http.request.uri.path, "/public-images/uploads/")
 and not cf.client.bot and http.referer ne ""
 and not starts_with(http.referer, "https://www.educalizando.com.br/")
 and not starts_with(http.referer, "https://educalizando.com.br/")
 and not starts_with(http.referer, "https://arquivos.educalizando.com.br/"))
```

Permite Referer vazio para downloads diretos e prévias de WhatsApp/redes, além dos bots verificados para Google Imagens/Bing. Conferir prévias sociais depois de ativar; adicionar apenas os parceiros de incorporação desejados. Referer pode ser forjado: hotlink protection não é autorização e nunca deve proteger materiais privados. Esta regra não se aplica a links pagos, tokens ou compras.

### 5. Métricas e alertas

- [ ] Workers & Pages → educalizando-app → Metrics: requisições mensais, CPU total e média/P90/P99, erros/1102, duração, falhas de subrequests e cron. Tempo aguardando rede não é CPU.
- [ ] Limiares operacionais por conta: atenção em 5 milhões de requests / 15 milhões de CPU-ms; agir antes de 8 milhões / 24 milhões. Somar todos os Workers. Usar projeção pelo número de dias do ciclo, não só últimos 30 dias.
- [ ] Storage & Databases → KV → namespace existente → Metrics: leituras, gravações, exclusões, listagens e armazenamento; investigar antes de 8 milhões de leituras, 800 mil gravações ou 800 MB. Verificar também erros de escrita por chave. Não criar um contador KV por visita.
- [ ] HTTP Traffic/Cache Analytics da zona: filtrar host `arquivos.educalizando.com.br`, caminho `/public-images/uploads/`; acompanhar bytes, HIT/MISS, status e Referer. Requests de imagem não devem aparecer como transferência no Worker da aplicação. Confira também Network no navegador: Request URL direto no MinIO e não `/media/catalogo/`.
- [ ] Workers → Settings → CPU limits: o limite por invocação reduz dano de execução descontrolada, mas não limita o total mensal. Não reduzir cegamente para 10 ms/100 ms: PDFs e importação são mais pesados. Medir P99 desses fluxos e então escolher um valor com margem. Esta tarefa não impôs um teto que pudesse cortar entregas licenciadas.
- [ ] Manage Account → Billing → Billable Usage: revisar assinatura, consumo incluído e produtos cobrados. Create budget alert → configurar email e o menor limiar monetário permitido para excedente, mais outro limiar de emergência. O alerta considera uso cobrado, não funciona como aviso antecipado de 80% da franquia; por isso os limiares de métricas acima são necessários.
- [ ] Notifications: criar alertas de uso por produto quando a conta oferecer esse tipo; alertas de erro de Worker e destinatários corretos. Não presumir que todos os produtos tenham um alerta de franquia configurável no plano atual. Acompanhar Billing diariamente enquanto não houver automação externa de monitoramento.
- [ ] Em ataque ou aproximação da franquia: bloquear origem do abuso pelo WAF antes de chegar ao Worker; revisar scrapers e jobs. Para exigir gasto variável zero mesmo em ataque, é preciso interromper o tráfego/serviço antes do limite, com indisponibilidade. Não foi criado desligamento automático que afete checkout/alunos.

### 6. Verificação após ativação

- [ ] Guest sem cookies: primeira visita MISS, segunda HIT em `X-Educalizando-Page-Cache`; com cookies/RSC/query, bypass esperado.
- [ ] Salvar produto/loja próprios: verificar atualização na página pública e no sitemap após propagação; endpoint de revalidação deve recusar outra loja/usuário.
- [ ] Testar links de compra/aluno em sessão de teste e download licenciado autorizado; não fazer compras fictícias para medir cache.
- [ ] Verificar imagens públicas 200 no MinIO, sem `X-Educalizando-Image-Cache`; estáticos com `immutable`; privados e links assinados com `no-store`.
- [ ] Conferir no Trace que redirects legados ativados se resolvem antes do Worker. Só então declarar zero invocações para esses caminhos antigos.

## Validação realizada

- Build de produção pelo script real: `node scripts/deploy-cloudflare.mjs --dry-run`, concluído com sucesso. Não houve publicação. O Wrangler validou o pacote com apenas ASSETS e VINEXT_KV_CACHE.
- `npm run lint`: zero erros, 17 avisos já existentes. Artefatos gerados em `dist` passaram a ser ignorados, assim como `.cloudflare`; o código-fonte continua coberto.
- `npm run typecheck:vinext`: aprovado, sem erros.
- `npm run test:verify` e `npm run test:uploads`: aprovados, incluindo isolamento entre lojas, finanças, acesso, proteção de webhooks, recuperação de salvamento e integridade do armazenamento.
- `npm run test:cloudflare-free`, testes de invalidação e contrato do Worker: aprovados. Cobrem cache HIT/MISS/SWR, falha de KV, sessão/RSC, transição de revisão, resposta ISR stale, fila assíncrona realista, retry limitado, propriedade da loja e corpo de requisição preservado.
- Verificações de marca, qualidade de SEO e render público do produto: aprovadas.
- HEAD externo de três imagens públicas: 200/WebP em todas; detectado `no-cache` adicional na entrega, registrado na regra B. Nenhum arquivo foi baixado ou alterado nesse teste.
- Exportação somente leitura: 434 redirects públicos, sem URLs assinadas. Nenhuma regra de Cloudflare foi ativada automaticamente.

Logs locais: `.cloudflare/cost-build-validated.log`, `cost-lint-final.log`, `cost-typecheck-final.log`, `cost-regression-final.log`, `cost-uploads-final.log`, `cost-contract-final.log` e `cost-seo-final.log`. Logs de testes podem conter falhas simuladas intencionalmente; o resultado final de cada comando é o critério de aprovação.

## Arquivos desta etapa e motivos

A árvore já continha alterações de outras tarefas. A lista abaixo registra somente os arquivos tocados nesta otimização; não representa todo o `git status`.

| Arquivo(s) | Motivo |
|---|---|
| `cloudflare/worker.js` | Ordem de execução: assets, proteção barata, redirect de imagem e cache antes do render |
| `cloudflare/public-page-cache.js` | TTL/SWR, isolamento de sessão, revisão por catálogo e proteção contra ISR stale |
| `cloudflare/cache-revision.js` | Leitura limitada da revisão no KV existente |
| `cloudflare/public-cache-runtime.js` | Aguardar invalidação Vinext e publicar revisão, com retry limitado |
| `cloudflare/response-cache-policy.js` | APIs, RSC e áreas privadas sempre sem cache |
| `cloudflare/catalog-image-cache.js` | Substituir proxy de bytes por redirect público validado |
| `cloudflare/traffic-guard.js` | Rejeitar sondagens antes de carregar o framework |
| `cloudflare/product-image-optimizer.js` | Impedir transformação paga no runtime Cloudflare |
| `cloudflare.config.ts` | Retirar binding IMAGES, preservando KV/cron existentes |
| `vite.config.mts` | Resolver adaptador de invalidação próprio do runtime |
| `scripts/deploy-cloudflare.mjs` | Tornar assets-first explícito no Wrangler gerado |
| `next.config.ts` | Desativar otimização remota de imagem e marcar documentos públicos elegíveis |
| `public/_headers` | Cache imutável para assets com hash; TTL menor para branding fixo |
| `eslint.config.mjs` | Excluir `dist` gerado pelo Vinext da análise de código-fonte |
| `src/lib/public-cache-runtime.ts` | Implementação neutra para execução Node/local |
| `src/lib/public-cache-invalidation.ts` | Coordenar tags, paths e revisão após salvamento autorizado |
| `src/lib/request-public-revalidation.ts` | Solicitar invalidação autenticada após salvar loja pelo fluxo atual |
| `src/app/api/cache/public-revalidate/route.ts` | Validar autenticação/propriedade e limitar invalidações |
| `src/lib/store-service.ts` | Acionar invalidação depois de salvar com sucesso |
| `src/app/api/produtos/post.ts`, `put.ts`, `route.ts` | Invalidar páginas após operações existentes de produto |
| `src/app/api/ai/seo-apply/route.ts` | Propagar alterações salvas pela ferramenta SEO |
| `src/lib/seo-public-catalog.ts` | Cache de catálogo por hora com tag invalidável |
| `src/app/page.tsx`, `src/app/sitemap.ts` | Revalidação de home/sitemap por hora |
| `src/app/loja/[slug]/layout.tsx` | Compartilhar a consulta da loja na mesma renderização |
| `src/app/loja/[slug]/page.tsx` | Revalidação por hora e retirar log rotineiro |
| `src/app/produto/[slug]/page.tsx`, `src/app/loja/[slug]/produto/[produtoSlug]/page.tsx`, `src/app/categorias/[slug]/page.tsx` | Revalidação por hora das páginas públicas |
| `src/lib/public-image-url.ts` | Resolver referências legadas para o mesmo objeto público MinIO |
| `src/lib/catalog-image-url.ts`, `src/lib/public-links.ts` | Evitar geração de novos links de proxy de imagem |
| `src/lib/seo.ts`, `src/lib/catalog-seo.ts`, `src/lib/catalog-sitemap.ts` | Usar capa direta em metadata, JSON-LD e sitemap |
| `src/components/store/ProductPublicSummary.tsx` | Emitir referência direta da capa |
| `src/app/loja/[slug]/kit/[id]/KitDetailClientView.tsx` | Normalizar imagens legadas do kit sem mudar dados cadastrados |
| `src/app/api/storage/public-image/route.ts` | Redirect sem leitura do arquivo; resposta API privada |
| `src/app/api/storage/public-media/route.ts` | Redirect para imagens reconhecidas, preservando outros tipos |
| `src/app/imagens/produtos/[slug]/capa/route.ts` | Resolver capa e redirecionar, sem transmitir bytes |
| `src/app/api/storage/upload-image/route.ts` | Preservar bytes/MIME quando transformação paga estiver desativada |
| `src/lib/object-storage.ts` | Reforçar `no-store` no GET assinado temporário |
| `scripts/export-public-image-redirects.mjs` | Exportação somente leitura do CSV de redirects públicos |
| `scripts/verify-public-page-cache.mjs` | Testar HIT/MISS, SWR, privacidade, propagação e ISR stale |
| `scripts/verify-public-cache-invalidation.cjs` | Testar fila Vinext, ordem, retry, autenticação e isolamento da purga |
| `scripts/verify-cloudflare-cost-contract.mjs` | Conferir artefato real, bindings, assets-first e comportamento do Worker |
| `scripts/verify-cloudflare-performance.mjs` | Garantir respostas privadas e ausência de proxy de imagem |
| `scripts/verify-cloudflare-adapters.cjs` | Garantir transformação paga desativada e preservar testes DNS |
| `scripts/verify-catalog-images.mjs` | Validar redirects, imagens diretas e rejeição de caminhos privados |
| `scripts/verify-brand-seo.cjs`, `scripts/verify-seo-quality.cjs`, `scripts/verify-product-seo-render.cjs` | Adaptar fixtures de SEO à resolução direta de capas |
| `scripts/verify-product-create.cjs` | Isolar efeito de invalidação no teste de criação existente |
| `ops/CLOUDFLARE-CUSTO-CACHE-2026-10-17.md` | Arquitetura, orçamento, checklist e limitações |

Artefato auxiliar: `.cloudflare/public-image-redirects.csv`, com 434 redirects de URLs públicas legadas para importação manual. Não contém links assinados e não foi ativado. Regenerar se as capas mudarem.

## Fontes oficiais consultadas

- [Workers: preços](https://developers.cloudflare.com/workers/platform/pricing/)
- [KV: preços](https://developers.cloudflare.com/kv/platform/pricing/)
- [Assets e cobrança](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)
- [Headers de assets](https://developers.cloudflare.com/workers/static-assets/headers/)
- [Cache Rules](https://developers.cloudflare.com/cache/how-to/cache-rules/settings/)
- [Rate limit: disponibilidade por plano](https://developers.cloudflare.com/waf/rate-limiting-rules/)
- [Bot Fight Mode e limitações](https://developers.cloudflare.com/bots/get-started/bot-fight-mode/)
- [Budget alerts: não bloqueiam gasto](https://developers.cloudflare.com/billing/manage/budget-alerts/)
- [CSV de Bulk Redirects](https://developers.cloudflare.com/rules/url-forwarding/bulk-redirects/reference/csv-file-format/)
