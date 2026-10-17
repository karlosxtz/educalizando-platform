# Relevância das páginas públicas — 17/10/2026

## Objetivo e resultado

Melhorar oito páginas existentes sem criar URLs em massa, editar cadastros de
criadores ou afirmar superioridade de ranking sobre outro site. A nota interna
de cadastro não representa uma nota do Google nem garante posição na pesquisa.

O componente antigo usava `searchProducts` com correspondências parciais e
ordenação por popularidade. Termos compostos podiam aceitar apenas uma palavra,
como `ensino`, e ocupar espaço com resultados distantes do assunto da página.

Agora a seleção editorial considera expressões completas e variações explícitas
sem acentos. Título/tags têm prioridade sobre categoria/nível principal e descrição;
popularidade só desempata a relevância. Não há alteração na busca geral, nas
classificações cadastradas, na publicação ou no acesso aos produtos.

## Conteúdo e navegação

- Duas orientações próprias por página, explicando seleção e aplicação do recurso.
- Três links para conteúdos relacionados, com nomes descritivos e sem prefetch.
- Breadcrumb visível, um H1 e seções com H2.
- Títulos únicos, com até 60 caracteres, sem reticências; descrições únicas,
  canonical absoluto e títulos sociais correspondentes.
- A página de planos explica que estar na seleção não comprova alinhamento à BNCC.
- ItemList inclui exatamente os produtos mostrados; FAQs visíveis correspondem ao JSON-LD.
- Se não houver correspondência, apresenta uma mensagem transparente e link para
  o catálogo geral, sem inventar que há novos produtos chegando.

## Leitura pública conferida no Supabase

Foi realizada somente leitura com cliente público, respeitando o RLS existente.
Consulta conferida com as mesmas colunas e relações usadas no novo serviço.
Nenhuma chave ou URL de arquivo de entrega faz parte da projeção.

| Página existente | Correspondências na amostra | Exibidos |
|---|---:|---:|
| /materiais-didaticos | 265 | 8 |
| /atividades-alfabetizacao | 115 | 8 |
| /educacao-infantil | 140 | 8 |
| /planos-de-aula-bncc | 4 | 4 |
| /atividades-para-imprimir | 265 | 8 |
| /jogos-pedagogicos | 28 | 8 |
| /atividades-ensino-fundamental | 162 | 8 |
| /recursos-pedagogicos | 265 | 8 |

Os números são uma fotografia do catálogo, não são depoimentos ou contadores
promocionais. A seleção se baseia nas informações fornecidas pelos criadores;
não comprova qualidade pedagógica nem examina o conteúdo dos arquivos pagos.

## Cache, segurança e limites

Uma leitura pública compartilhada substitui as buscas independentes dessas oito
páginas. Cache de uma hora, tag `public-catalog`, deduplicação por renderização e
invalidação pelo mecanismo já existente após salvar loja/produto. Sem novos
bindings, infraestrutura, planos ou alterações no armazenamento. Usa a API
`unstable_cache` implementada no Vinext atual; a documentação do Next 16 recomenda
`use cache`, mas o próprio Vinext documenta lacunas em Cache Components.

A consulta mantém o limite atual de 500 produtos recentes, ordenação estável e
status `publicado`, sem excluídos. Na conferência atual, retornou 265 produtos:
o limite não cortou a amostra. Quando o catálogo ultrapassar 500, será necessário
reavaliar seleção/paginação por tema; isso não é uma listagem integral ilimitada.
Falha de consulta lança erro em vez de gravar catálogo vazio no cache.

O novo cache compartilha o KV e a tag existentes; não elimina operações faturáveis
nem constitui garantia de permanecer em US$ 5. Não há mudança de sitemap ou de
política de indexação nesta entrega.

## Arquivos desta entrega

| Arquivo | Motivo |
|---|---|
| src/lib/intent-product-selection.ts | Seleção temática, relevância, deduplicação e proteção contra rascunhos/excluídos. |
| src/lib/intent-catalog.ts | Consulta pública restrita, cache compartilhado e invalidação existente. |
| src/lib/intent-editorial.ts | Orientações próprias, títulos e navegação entre as oito páginas. |
| src/lib/seo-landings.ts | Metadados sem cortes e linguagem responsável sobre BNCC. |
| src/components/seo/IntentLandingPage.tsx | Renderizar seleção, orientações, navegação e dados estruturados coerentes. |
| scripts/verify-intent-landings.cjs | Testes de relevância, exclusões, metadados, falha de leitura e HTML/JSON-LD. |
| ops/SEO-RELEVANCIA-2026-10-17.md | Escopo, evidências, limites e validação. |

## Validação

- `node scripts/verify-intent-landings.cjs`: passou.
- Regressões `verify-brand-seo`, `verify-seo-quality`, `verify-product-seo-render`: passaram.
- `npm run lint`: passou, sem erros ou avisos.
- `npm run typecheck:vinext`: passou.
- `node scripts/deploy-cloudflare.mjs --dry-run`: build de produção e empacotamento
  passaram; avisos de tamanho de chunks e módulo legado não impediram a conclusão.
  Logs locais: `.cloudflare/intent-{lint,typecheck,build}.log`.
- Consulta pública real: `.cloudflare/intent-public-selection.json` (artefato local).

Mudanças locais; não publicadas nesta etapa. O build usa o script do projeto com
`--dry-run` para validar o pacote de produção sem publicar. O resultado no Google
deve ser acompanhado após publicação e novo rastreamento; não há prazo ou posição
garantidos.
