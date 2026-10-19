# Blog dos criadores

## Uso

Painel do criador → **Marketing e crescimento → Blog do criador** (`/dashboard/blog`). O blog público também oferece **Escrever um artigo** / **Escrever no blog**, apontando para o editor autenticado.

O criador informa título (8–180 caracteres), resumo (40–360), tema, texto e capa opcional. A prévia usa a mesma formatação da página pública. Use `## Subtítulo`, uma linha em branco entre parágrafos e `- Item` para listas. Links HTTPS ficam clicáveis; nenhum HTML do autor é executado. O upload usa o componente e o MinIO existentes, sem criar serviço de imagem ou alterar armazenamento.

**Salvar rascunho** mantém o texto privado. **Publicar no blog** torna o artigo visível em `/blog` e na URL própria. **Retirar do ar e salvar rascunho** remove a publicação sem apagar o texto. Cada criador lista e edita somente seus próprios artigos. A URL de um artigo permanece estável mesmo quando o título muda. Não foi adicionado botão de exclusão definitiva.

O blog público mostra capa, tema, resumo, data e loja autora, oferece busca por título, filtros de tema e paginação de 12 artigos. A página do artigo mostra a autoria e uma chamada para a loja. Artigos institucionais anteriores continuam com autoria da equipe Educalizando. Não foram criados artigos fictícios.

## Banco, autorização e cache

Migration `20261019030000_add_creator_blog_authorship.sql`: acrescenta `store_id` e `topic` à tabela existente `blog_posts`, com FK e índice por loja. O usuário informou a execução; consulta pública confirmou os campos e a relação, sem posts publicados na verificação inicial. As políticas e permissões RLS existentes não foram alteradas. Nenhuma regra de preço, checkout, entrega, Asaas ou webhook foi modificada.

A nova API resolve a sessão no servidor e consulta a loja pelo `creator_id` autenticado. Atribuição não é recebida do cliente: o `store_id` vem da sessão e do banco. Leitura e escrita privadas incluem o filtro de loja. Não é possível usar essa API para editar artigos da plataforma ou de outra loja. Entradas têm limite de tamanho, URL de capa restrita ao armazenamento público existente e limite de frequência de escrita. Respostas privadas usam `Cache-Control: private, no-store`.

Os artigos públicos mantêm a política de leitura somente para `published` com data válida. Rascunhos retornam 404 pela rota pública. Novas publicações e alterações disparam a invalidação pública já existente, incluindo blog, artigo e sitemap. O sitemap existente já lê artigos publicados, portanto passa a incluir os artigos dos criadores automaticamente. O status dessa invalidação é devolvido ao editor; uma eventual pendência não é apresentada como falha na gravação.

## SEO e referência

Blog e artigos usam canonical no domínio oficial, metadata social, `BlogPosting` com autoria real e breadcrumb no artigo. Busca, tema e paginação não entram no índice como páginas independentes. O painel herda o noindex da área privada. Consultas repetidas ao artigo durante renderização/metadata são deduplicadas com React cache.

Referência de navegação analisada: https://bibliotecadoprofessor.com.br/blog. A implementação usa conteúdo, identidade e arquitetura próprios; não copia artigos nem inventa contagens, datas ou resultados de SEO.

## Verificação

- Migration reconhecida em consulta somente leitura; nenhum dado cadastrado foi alterado durante testes.
- Teste `node scripts/verify-creator-blog.cjs`: autenticação, exigência de loja, isolamento entre autores, rejeição de atribuição forjada, campos e URLs inválidos, limite de texto, renderização escapada, publicação, retirada para rascunho, slug estável, invalidação e rate limit.
- Lint, typecheck, limite de tamanho de fontes e build real de produção Vinext/Wrangler executados antes da publicação.
- Não foi possível fazer revisão visual interativa: o controle do navegador está desativado nas configurações do Work. O comportamento de gravação foi testado com banco simulado, sem inserir publicações de teste em produção.

## Arquivos alterados

| Arquivo | Motivo |
| --- | --- |
| `supabase/migrations/20261019030000_add_creator_blog_authorship.sql` | Autoria por loja e tema, preservando políticas existentes. |
| `src/lib/creator-blog-input.ts` | Validação dos campos, temas e geração de slug. |
| `src/app/api/creator/blog/route.ts` | Listagem e escrita privadas com autorização por loja, publicação e invalidação. |
| `src/app/dashboard/blog/page.tsx` | Editor, upload, prévia, rascunhos, publicação e gestão dos próprios textos. |
| `src/components/dashboard/Sidebar.tsx` | Acesso ao módulo no painel do criador. |
| `src/components/blog/BlogArticleBody.tsx` | Formatação do texto sem HTML arbitrário. |
| `src/lib/blog-service.ts` | Consulta pública paginada com autoria e deduplicação de leitura do artigo. |
| `src/app/blog/page.tsx` | Vitrine pública de artigos, busca, temas, paginação e convite aos criadores. |
| `src/app/blog/[slug]/page.tsx` | Conteúdo, loja autora, CTA e dados estruturados reais. |
| `scripts/verify-creator-blog.cjs` | Testes de autorização, validação, publicação e renderização segura. |
| `ops/BLOG-CRIADORES-2026-10-19.md` | Uso, arquitetura, verificações e inventário da entrega. |
