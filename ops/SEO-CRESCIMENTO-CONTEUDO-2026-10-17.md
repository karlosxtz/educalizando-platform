# Qualidade, descoberta e divulgação — 17/10/2026

## O que esta etapa entrega

- Produto canônico e produto aberto pela loja exibem um guia de escolha no HTML
  inicial, que permanece após carregar a interface interativa. Usa formato,
  quantidade, faixa indicada, cor e biografia realmente cadastrados. Campos
  ausentes não ganham conteúdo presumido. Não há nova consulta ao banco.
- Prévia pública cadastrada ganha uma chamada clara no guia. Links com esquema
  inseguro, credenciais, assinatura temporária ou bucket privado não são expostos
  por esse componente. O arquivo pago não é usado como amostra.
- Versão PLR não herda prévia, quantidade de páginas ou faixa etária da versão
  final. O resumo inicial também deixa de apresentar esses campos para PLR.
- Categorias existentes ganham critérios de escolha e links para níveis e temas
  efetivamente presentes nos 24 resultados exibidos. A seleção não representa uma
  contagem completa de todo o catálogo. A relação de nível e os temas são lidos
  na consulta existente; não há uma consulta por cartão ou por produto.
- Um atalho leva da introdução da categoria aos materiais. Os textos únicos já
  publicados nas dez principais categorias e nas duas datas de novembro continuam.
- Carrossel de banners deixa de importar Framer Motion, mantém troca manual e
  automática e ganha pausa explícita. Não avança fora da tela, com foco/hover,
  com movimento reduzido ou em aba oculta. O observador e o timer são limpos.
- A seção mensal que não precisa de estado passa a Server Component. Apenas os
  links com atribuição continuam interativos. Imagens seguem no armazenamento
  atual; não foi criado proxy ou serviço de transformação pago.

Não houve edição de registros dos criadores, preços, arquivos, licenças, RLS,
checkout, Asaas ou webhooks. Não foram criadas páginas em massa, avaliações ou
credenciais profissionais. A nota de SEO não representa uma posição no Google.

## Produtos para o trabalho editorial dos criadores

Base: Search Console observado nesta data, últimos 28 dias. As informações não
foram consultadas novamente para afirmar crescimento posterior à publicação.

| Material | Impressões | Cliques | Próxima contribuição real do criador |
|---|---:|---:|---|
| Cabelo Maluco — Carrinho de Corrida | 726 | 5 | Prévia legível da montagem e confirmação dos itens incluídos. |
| Cabelo Maluco — Unicórnio Menina | 513 | 8 | Mostrar uma página do arquivo e explicar a preparação efetiva. |
| Kit Lembrancinhas Dia das Crianças com Doces | 447 | 10 | Confirmar os modelos e distinguir arquivo digital de itens físicos. |
| Painel Desfile Maluco | 248 | 10 | Informar dimensões e montagem somente se verificadas no arquivo. |
| Kit Outubro Rosa — Plaquinhas | 230 | 5 | Conferir quais modelos compõem o pacote e o público pretendido. |

São propostas para revisão, não afirmações de que esses dados estejam ausentes
ou de que os arquivos tenham características específicas. Não substituir texto
cadastrado sem a revisão do responsável. O interesse por esses temas é sazonal.

## Roteiro de conteúdo e reconhecimento

### Primeira etapa: conferir a apresentação

Abra os produtos prioritários em um celular. Veja se a capa é legível e se a
prévia cadastrada realmente mostra parte do material. No cadastro, o criador
pode explicar conteúdo incluído, público, formato e preparação com base no
arquivo original. Não completar lacunas com informações inventadas pela IA.

### Segunda etapa: propostas de novembro

Revisar as páginas existentes de Proclamação da República e Consciência Negra.
Usar os guias já publicados para selecionar recursos pertinentes e solicitar ao
criador uma demonstração verdadeira. Para Consciência Negra, conferir referências,
contextualização e ausência de estereótipos. Não limitar o trabalho ao mês da data.

### Terceira etapa: demonstrações e parcerias

Preparar uma demonstração curta de um material com autorização do autor: mostrar
o arquivo ou uma montagem real, explicar o objetivo e apontar para a página
canônica. Não divulgar arquivos pagos completos como amostra. Se houver imagem
de estudantes, sua publicação exige as autorizações pertinentes.

Contatar professores, escolas e blogs que já trabalhem o tema. Oferecer uma
contribuição útil, sem exigir link ou avaliação positiva. Não comprar backlinks,
publicar comentários em massa ou criar depoimentos. Nenhum contato foi enviado.

Modelo editável para uma parceria, a ser revisado e enviado pelo responsável:

> Olá! Sou da Educalizando. Gostaríamos de propor uma demonstração de um material
> relacionado ao tema que vocês trabalham. Podemos apresentar uma prévia e as
> condições de uso para vocês avaliarem se faz sentido para sua comunidade?

Modelo de divulgação a completar apenas com fatos confirmados:

> Vai trabalhar [tema] com sua turma? Este material inclui [itens confirmados].
> Veja a prévia, o formato e as condições de uso na página: [link do produto].

Modelo para recolher uma opinião de comprador real, sem recompensa condicionada:

> Você conseguiu usar o material? Sua avaliação sincera ajuda outros educadores
> a entender a proposta. Conte o que funcionou e o que poderia melhorar.

### Quarta etapa: medir antes de mudar de novo

No Search Console, comparar os próximos 28 dias com os anteriores. Separar a
marca por `educalizando|educaizando`, consultas não relacionadas à marca e
dispositivos. Filtros por consulta são parciais por privacidade: não classificar
todos os cliques restantes como não relacionados à marca. Comparar páginas
sazonais considerando a proximidade da data e, quando houver histórico, o mesmo
período do ano anterior. Não trocar títulos diariamente.

Anotar impressões, cliques, CTR e posição das mesmas URLs. Mais impressões com
CTR menor não são, sozinhas, prova de piora. Avaliar também se as consultas novas
correspondem ao conteúdo. Monitorar erros HTTP, sitemap, canonical e dados
estruturados, distinguindo noindex intencional de falhas reais.

## Desempenho: ponto de partida

O teste anterior à presente etapa passou de 66 para 86 em desempenho móvel,
LCP de 5,1 s para 3,6 s e CLS de 0,18 para zero. Relatório de laboratório:
https://pagespeed.web.dev/analysis/https-www-educalizando-com-br/ad4wozr6d7?form_factor=mobile

Esses números não medem o efeito deste novo carrossel. Não há dados de campo
suficientes no Search Console para concluir que todas as páginas passam nos
Core Web Vitals. Uma comparação futura deve usar o mesmo perfil de teste e
considerar a variação entre execuções.

## Arquivos desta etapa

Validação local concluída: lint sem erros (17 avisos anteriores), typecheck
Vinext, testes de seleção/SEO/HTML público, qualidade editorial, imagens MinIO,
cache público e limite de tamanho dos arquivos. Build de produção do runtime
atual validado pelo script de deploy com `--dry-run`, sem publicação manual.
Os resultados de produção serão conferidos após o envio dos commits ao pipeline.

| Arquivo | Motivo |
|---|---|
| src/lib/product-selection.ts | Fatos exibíveis e validação da prévia sem acessar entrega paga. |
| src/components/store/ProductSelectionGuide.tsx | Guia persistente no HTML, prévia e biografia cadastrada. |
| src/components/store/ProductPublicSummary.tsx | Evitar atribuir detalhes da versão final ao PLR. |
| src/app/produto/[slug]/page.tsx | Integrar o guia ao produto canônico. |
| src/app/loja/[slug]/produto/[produtoSlug]/page.tsx | Usar o mesmo guia na navegação pela loja. |
| src/components/seo/CategorySelectionGuide.tsx | Critérios de escolha e descoberta a partir dos resultados reais. |
| src/app/categorias/[slug]/page.tsx | Integrar o guia e o atalho aos materiais. |
| src/lib/seo-public-catalog.ts | Obter nível e temas pela consulta existente. |
| src/components/MainBannersCarousel.tsx | Retirar animação pesada e controlar avanço, foco, pausa e visibilidade. |
| src/components/MonthlyCampaignCarousel.tsx | Renderização no servidor da seção sem estado. |
| scripts/verify-seo-selection.cjs | Regressão de fatos, PLR, links, renderização e timers. |
| ops/SEO-CRESCIMENTO-CONTEUDO-2026-10-17.md | Evidências, inventário e roteiro editorial/divulgação. |

Referências: [conteúdo útil e autoria real](https://developers.google.com/search/docs/fundamentals/creating-helpful-content),
[Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals).
