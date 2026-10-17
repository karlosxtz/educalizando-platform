# SEO público — 14/10/2026

Publicado no Cloudflare Worker: `4cfb4d92-5140-454f-b1a8-9894ccf52ec2`.

## Alterações publicadas

- Metadados compartilhados entre a página global do produto e a vitrine. Produtos publicados têm index/follow explícito, canonical global, compartilhamento e prévia de imagem grande.
- Versão PLR usa descrição própria quando cadastrada; dados estruturados identificam a oferta/URL PLR e usam o preço real. O canonical concentra a variante na página principal.
- Descrição de busca preserva também textos curtos reais, remove HTML/scripts e evita cortar palavras. Product JSON-LD recebe descrição mais completa, sem incluir os arquivos privados.
- Um único H1 nas páginas de produto, mantendo as apresentações móvel e desktop.
- Validação de associação da vitrine: aceita produtos próprios e afiliações aprovadas presentes no catálogo público da loja, recusando URLs de lojas sem associação.
- HTML inicial mais leve com título, capa, descrição, preço e link para compra. Galeria, avaliações e controles completos carregam progressivamente no navegador. A página pública permanece utilizável se o módulo interativo não baixar.
- Dados de exibição atravessam a fronteira para o navegador; caminhos privados de entrega e de licença não são serializados. Prévias, vídeo, galeria, datas e dados necessários à compra foram preservados.
- Recomendações de produto usam consulta limitada a 16 registros de exibição, evitando carregar todos os materiais, arquivos e galerias da loja durante cada acesso de produto.
- Categorias usam títulos mais concisos e descrições sem alegações genéricas de especialistas.
- Produtos, lojas, combos, clubes e posts deixam de ser congelados no sitemap estático; o sitemap dinâmico os mantém atualizados. Categorias e níveis com materiais também entram no sitemap dinâmico. Sitemap estático regenerado com acesso real ao banco.
- Noindex de contas, administração, checkout e combinações arbitrárias de busca foi preservado. Remover esses bloqueios não ajudaria a indexar os produtos.

## Validação

TypeScript, testes do catálogo/metadata/sitemap, renderização real do resumo com React, versão PLR, isolamento de entrega privada e limite de tamanho passaram. ESLint sem erros; três avisos preexistentes de imports não usados no componente legado.

No navegador, o material Reforma Protestante mostrou H1 único, capa carregada, galeria, opções de carrinho e compra, sem erros de console. Não houve compra nem alteração de produto real nos testes.

Amostra inicial após publicação: 20 URLs retornaram 200, incluindo 15 produtos com H1 único e Product JSON-LD completo. As URLs global e da vitrine compartilharam o canonical esperado. Robots e sitemap dinâmico responderam 200.

## Pendência crítica encontrada na auditoria completa

A amostra não representou a estabilidade geral. Nova auditoria das 402 URLs encontrou 222 respostas 503, dois acessos sem resposta conclusiva e 32 páginas 200 de produto incompletas. Houve 256 URLs com algum erro. Os resultados completos estão em `seo-audit-general-report.json`; a auditoria anterior de 401 URLs foi preservada em `.cloudflare/seo-before-2026-10-14.json`.

Confirmado em corpo de resposta: Cloudflare 1102, Worker exceeded resource limits. Isso ainda impede uma indexação consistente. As verificações não provam que o site inteiro está estável, que resultados ricos foram aprovados pelo Google ou que a posição melhorou. As duas auditorias ocorreram em momentos diferentes e não são um benchmark controlado de desempenho.

Também foi tentada verificação real das versões final/PLR do Jogo das Sílabas; ambas retornaram 503 naquele momento, portanto essa validação em produção permanece pendente. Os testes locais dos valores final/PLR passaram.

Para estabilidade mantendo Cloudflare Free, a renderização dinâmica ainda precisa ser transferida para infraestrutura adequada (por exemplo a VPS existente) ou substituída por geração estática com atualização automática do catálogo. Não houve contratação, mudança de plano ou migração de hospedagem. Não foi feito envio ao Search Console nem solicitação de indexação nesta sessão.

Referências: https://developers.google.com/search/docs/appearance/structured-data/product-snippet e https://developers.google.com/search/docs/specialty/ecommerce/designing-a-url-structure-for-ecommerce-sites ; limites: https://developers.cloudflare.com/workers/platform/limits/ .
