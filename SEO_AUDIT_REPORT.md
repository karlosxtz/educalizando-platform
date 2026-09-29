# Relatório local — auditoria e melhorias SEO seguras

Data da execução: 28/09/2026
Escopo: SEO técnico e editorial seguro, sem alteração do funcionamento comercial.

## 1. Arquivos alterados

### Infraestrutura SEO, homepage e rastreamento

- `src/lib/seo.ts` (novo): constantes de URL/imagem social, helper de Open Graph/Twitter e serialização segura de JSON-LD.
- `src/app/layout.tsx`: `metadataBase` fixado no domínio canônico oficial e fallback social global.
- `src/app/page.tsx`: metadata completa, WebSite e Organization JSON-LD, e carregamento resiliente das seções públicas.
- `src/app/loading.tsx`: estado de carregamento visível e acessível para evitar aparência de tela branca.
- `src/app/sitemap.ts`: novas rotas editoriais, preservação de rotas estáticas quando a fonte dinâmica falha e remoção de duplicatas.
- `src/app/robots.ts`: bloqueios privados também aplicados ao grupo específico do Googlebot.
- `src/components/HomepageMarketplace.tsx`: links das categorias principais apontando para landings editoriais descritivas.

### Metadata, Open Graph e dados estruturados

- `src/app/calendario/page.tsx`
- `src/app/calendario/[slug]/page.tsx`
- `src/app/categorias/[slug]/page.tsx`
- `src/app/disciplinas/[slug]/page.tsx`
- `src/app/atividades-por-ano/page.tsx`
- `src/app/atividades-por-ano/[slug]/page.tsx`
- `src/app/blog/page.tsx`
- `src/app/blog/[slug]/page.tsx`
- `src/app/glossario/page.tsx`
- `src/app/glossario/[slug]/page.tsx`
- `src/app/loja/[slug]/page.tsx`
- `src/app/loja/[slug]/produto/[produtoSlug]/page.tsx`
- `src/app/produto/[slug]/page.tsx`
- `src/app/lojas/page.tsx`
- `src/app/ofertas/page.tsx`
- `src/app/materiais-gratis/page.tsx`
- `src/app/ajuda/page.tsx`
- `src/app/sobre/page.tsx`
- `src/app/afiliados/page.tsx`
- `src/app/privacidade/page.tsx`
- `src/app/termos/page.tsx`
- `src/lib/seo-landings.ts`
- `src/components/seo/IntentLandingPage.tsx`

### Testes e documentação

- `tests/e2e/seo.spec.ts` (novo)
- `tests/e2e/public-mobile.spec.ts`
- `SEO_AUDIT_REPORT.md` (este relatório)

## 2. Title e description finais da homepage

- **Title:** `Materiais Didáticos Digitais para Professores | Educalizando`
- **Description:** `Encontre materiais didáticos digitais, atividades pedagógicas, apostilas, planos de aula e jogos educativos criados por professores.`
- **Canonical:** `https://www.educalizando.com.br`
- Foi confirmado um único H1 na homepage pelo teste E2E.

## 3. Páginas que receberam metadata

- Homepage: `/`.
- Calendário: `/calendario` e `/calendario/[slug]`.
- Taxonomias: `/categorias/[slug]`, `/disciplinas/[slug]`, `/atividades-por-ano` e `/atividades-por-ano/[slug]`.
- Conteúdo: `/blog`, `/blog/[slug]`, `/glossario` e `/glossario/[slug]`.
- Catálogo: `/lojas`, `/loja/[slug]`, `/produto/[slug]`, `/loja/[slug]/produto/[produtoSlug]`, `/ofertas` e `/materiais-gratis`.
- Institucionais: `/ajuda`, `/sobre`, `/afiliados`, `/privacidade` e `/termos`.
- Landings editoriais: `/materiais-didaticos`, `/atividades-alfabetizacao`, `/educacao-infantil`, `/planos-de-aula-bncc`, `/atividades-para-imprimir`, `/jogos-pedagogicos`, `/atividades-ensino-fundamental` e `/recursos-pedagogicos`.

As páginas dinâmicas preservam título, descrição e canonical específicos por entidade.

## 4. Páginas que receberam Open Graph

Todas as páginas listadas no item 3 passaram a ter Open Graph e Twitter Card explícitos por meio do helper central. Produtos, posts e lojas continuam usando a imagem própria quando ela existe; quando não existe, usam a imagem social padrão.

## 5. Páginas que receberam JSON-LD

- `/`: `WebSite` com `SearchAction` e `Organization`.
- `/calendario`: `CollectionPage` e `BreadcrumbList`.
- `/calendario/[slug]`: `WebPage` e `BreadcrumbList`.
- `/atividades-por-ano`: `CollectionPage` e `BreadcrumbList`.
- `/blog`: `CollectionPage`, `BreadcrumbList` e `ItemList` quando há posts.
- `/blog/[slug]`: `BlogPosting`.
- `/glossario/[slug]`: `DefinedTerm` e `BreadcrumbList`.
- `/loja/[slug]`: `Organization` e `BreadcrumbList`.
- Landings editoriais: `CollectionPage`, `BreadcrumbList`, `FAQPage` e `ItemList` quando há produtos.
- Categorias, disciplinas, anos escolares, materiais gratuitos e produtos mantiveram seus schemas existentes, agora com serialização segura contra injeção de `</script>`.

## 6. Imagem social utilizada

- **Arquivo real:** `public/branding/logo-og.png`
- **URL pública:** `https://www.educalizando.com.br/branding/logo-og.png?v=3`
- **Dimensões:** 1200 × 630 pixels.
- **Tamanho:** 243.091 bytes.
- O arquivo já existia no projeto; nenhuma URL foi inventada e nenhuma imagem nova foi gerada.
- Usada como fallback nas páginas do item 3. Produtos, posts e lojas podem substituí-la por sua imagem própria.
- O build de produção foi iniciado localmente e a imagem respondeu HTTP 200 com `Content-Type: image/png`, confirmando que está incluída e servida pelo build.

## 7. Resultado da auditoria do sitemap

- Endpoint de produção local: HTTP 200.
- 63 URLs na execução com o ambiente local.
- 63 URLs únicas; nenhuma duplicata.
- Nenhuma URL privada de `admin`, `dashboard`, `cliente`, `aluno`, `api` ou `checkout`.
- `/blog`, `/calendario` e `/atividades-por-ano` permanecem no sitemap mesmo quando a fonte dinâmica está indisponível.
- As URLs dinâmicas continuam sendo acrescentadas quando o banco configurado está acessível.
- Limitação desta execução: o `.env.local` aponta para o host fictício `xyzcompany.supabase.co`; portanto, a auditoria local não conseguiu enumerar entidades reais de produção. A estrutura, deduplicação, exclusão de rotas privadas e resposta do endpoint foram verificadas.

## 8. Resultado do robots.txt

- Endpoint de produção local: HTTP 200.
- Sitemap declarado: `https://www.educalizando.com.br/sitemap.xml`.
- Rotas privadas bloqueadas para `*` e também para o grupo específico `Googlebot`.
- `Googlebot-Image` continua liberado para que imagens públicas de produtos possam ser indexadas.
- Login/cadastro públicos do aluno permanecem permitidos conforme a regra existente.

## 9. Correções de links internos

Os quatro atalhos principais da homepage deixaram de apontar somente para filtros de busca e passaram a usar landings descritivas:

- Alfabetização → `/atividades-alfabetizacao`
- Educação infantil → `/educacao-infantil`
- Ensino fundamental → `/atividades-ensino-fundamental`
- Jogos pedagógicos → `/jogos-pedagogicos`

As landings mantêm links para o catálogo filtrado, lojas e conteúdos relacionados, melhorando a hierarquia sem alterar checkout, preços, produtos ou permissões.

## 10. Análise da tela branca

- A homepage dependia de quatro consultas externas dentro do mesmo carregamento. Uma rejeição podia impedir a entrega da página inteira.
- Cada seção pública agora falha de forma isolada e retorna lista vazia, permitindo que cabeçalho, conteúdo editorial e rodapé sejam renderizados.
- O `loading.tsx` global agora exibe marca, mensagem de progresso e estado acessível, evitando a percepção de uma página vazia durante navegação e renderização dinâmica.
- O build com o backend fictício indisponível concluiu as 179 páginas, evidenciando que a homepage degrada de forma controlada.
- Não foram alteradas regras comerciais, autenticação, checkout, pagamento, entrega ou banco.

## 11. Resultado dos testes

### Aprovados

- `npx tsc --noEmit`: aprovado.
- ESLint apenas nos arquivos alterados: 0 erros e 5 avisos preexistentes de uso de `<img>` em páginas que aceitam URLs externas.
- E2E SEO (`tests/e2e/seo.spec.ts`): 5/5 aprovados em execução serial.
- E2E calendário (`tests/e2e/calendar.spec.ts`): 10/10 aprovados em 320, 360, 375, 390, 414, 768, 1024 e 1280 pixels, incluindo detalhes e 404.
- Testes de negócio aprovados: financeiro, configuração financeira, idempotência do checkout, webhook InfinitePay, acesso à entrega, busca e fundação de indicações de criadores.

### Pendências preexistentes da suíte ampla

- `npm run lint` do repositório inteiro continua falhando com 838 ocorrências (379 erros e 459 avisos) espalhadas em scripts, telas administrativas e bibliotecas fora do escopo SEO. O lint dirigido aos arquivos desta entrega passou sem erros.
- A suíte Playwright ampla executada com concorrência teve estouros de tempo enquanto o servidor de desenvolvimento compilava rotas. SEO e calendário foram repetidos em série e passaram integralmente.
- Dois testes antigos de campanha continuam desalinhados com a interface atual: um procura o texto removido `Tema em destaque` e espera a campanha antes das categorias; outro combina campanha pausada com uma expectativa de troca automática. Nenhuma dessas falhas foi causada pelas alterações SEO, e a lógica comercial não foi alterada para mascará-las.

## 12. Resultado do build

- Comando: `npm run build`.
- Resultado: aprovado.
- Next.js 16.3.0 / Turbopack compilou, validou TypeScript e gerou 179 páginas.
- O build emitiu avisos existentes sobre Edge Runtime e registrou falhas de consulta ao host fictício do Supabase, mas concluiu com código 0.
- O servidor do build respondeu homepage, imagem OG, sitemap e robots com HTTP 200.

## 13. Resultado do git diff --check

- Aprovado com código 0.
- Apenas mensagens informativas de normalização futura de LF para CRLF no Windows; nenhum erro de espaço em branco.

## 14. Confirmação de que o banco não foi alterado

Confirmado. Nenhuma tabela, dado, política, função, trigger ou configuração do banco foi alterada. A lista de arquivos modificados não contém artefatos de banco.

## 15. Confirmação de que não houve migration

Confirmado. Nenhum arquivo SQL ou diretório de migration foi criado ou modificado.

## 16. Confirmação de que não houve commit, push ou deploy

Confirmado.

- HEAD permaneceu em `ae2833b423450e3e1d6071076c023166f1bfaac0`.
- Nenhum commit foi criado.
- Nenhum push foi executado.
- Nenhum deploy foi executado.
- Todas as alterações permanecem locais e revisáveis no working tree.
