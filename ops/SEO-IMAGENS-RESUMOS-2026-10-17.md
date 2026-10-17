# Descoberta de imagens e resumos de produtos

## Evidências antes desta publicação

Auditoria de dez páginas de produto presentes no relatório de oportunidades do
Search Console de 17/10/2026. Todas responderam HTTP 200. Os volumes de busca
continuam sendo os da coleta anterior; não houve nova medição de crescimento.

O resumo do Carrinho de Corrida começava com “Prepare-se para uma corrida”,
enquanto a descrição cadastrada detalha os elementos incluídos. O resumo do
Unicórnio também priorizava a introdução promocional. São oportunidades de
apresentação, sem autorização para inventar características ou editar cadastros.

O sitemap respondeu HTTP 200 com 380 URLs de página e 265 referências de imagem.
Ele listava somente a capa dos produtos. Quinze imagens dessa lista responderam
HTTP 200: onze no MinIO sem cabeçalho de bloqueio e quatro capas antigas no
Supabase com `X-Robots-Tag: none`. Esse cabeçalho impede a indexação dessas quatro
imagens; HTTP 200 sozinho não significa permissão de indexação. Não é um bloqueio
da página do produto. A amostra não determina quantas outras imagens antigas
apresentam a mesma situação.

O ajuste dessas capas exige acesso autorizado à origem do Storage. O ambiente
local tem somente a chave pública de leitura, e o navegador não mantém uma sessão
do painel disponível. Não foram extraídas credenciais, alteradas permissões ou
migrados arquivos para contornar isso. A origem das imagens permanece intacta.

A leitura anônima, respeitando as permissões públicas existentes, encontrou 58
registros de galeria nos dez produtos. Seus endereços antigos foram resolvidos
com o mesmo conversor da aplicação: 58 imagens únicas no MinIO responderam HTTP
200, sem falhas. Isso é uma verificação de disponibilidade nesta amostra, não
uma comprovação de rastreamento ou indexação pelo Google.

O endereço `/robots.txt` do host de arquivos responde 403. Isso não foi tratado
como bloqueio das imagens: o Google documenta que 4xx, exceto 429, nessa consulta
equivalem à ausência de um arquivo robots válido. As imagens públicas continuam
respondendo 200. Não houve mudança de política dos buckets nem das proteções dos
materiais pagos.

## Correções implementadas

1. Resumos procuram uma frase informativa já existente sobre o que o kit,
   arquivo ou material inclui, contém ou reúne. Havendo essa frase, ela pode
   substituir o início promocional apenas nos metadados. A descrição original,
   o nome do produto, os preços e os registros dos criadores não são alterados.
2. Perguntas e trechos condicionais/negativos não são usados como afirmação de
   conteúdo incluído. Quando não há candidato adequado, o resumo mantém a
   estratégia anterior. O limite continua em 155 caracteres, com referência
   de desambiguação preservada e sem terminar em artigos ou preposições soltos.
3. HTML, Open Graph e Twitter usam o mesmo resumo. Não há garantia de que o Google
   exibirá esse texto, pois ele pode escolher outro trecho da página.
4. Um seletor compartilhado resolve e deduplica capa e imagens registradas da
   galeria, preservando a ordem original no banco. Usa até sete imagens públicas
   por produto no sitemap e no JSON-LD Product. URLs assinadas, com credenciais,
   arquivos privados ou que não sejam imagens são excluídos dessa descoberta.
5. O HTML inicial mostra até três imagens adicionais da galeria, com dimensões,
   texto alternativo e carregamento lazy. A interface completa continua exibindo
   sua galeria atual. Tudo usa imagens públicas já existentes, sem geração de
   amostras, upload, cópia para Cloudflare ou transformação paga.
6. O sitemap obtém as relações de imagem na leitura pública existente, cacheada
   por uma hora. Não há uma consulta adicional por produto. A chave dessa leitura
   foi versionada para evitar reaproveitar o resultado antigo sem galerias.
7. PLR não herda a galeria nem as propriedades de formato, quantidade de páginas
   e faixa etária da versão final nos dados estruturados. Preço, oferta, licença,
   avaliações reais e canonical continuam com suas regras existentes.

Nenhuma URL nova de página foi criada. As imagens entram nas extensões das URLs
canônicas dos produtos; variantes abertas pela loja continuam fora do sitemap.
Não houve alteração de RLS, checkout, Asaas, webhooks ou dados cadastrados.

## Verificação

- Lint: zero erros; 17 avisos anteriores.
- Typecheck Vinext e build de produção pelo script do projeto: aprovados.
- Testes de resumos, SSR, imagem/sitemap/JSON-LD, PLR, avaliações reais, canonical,
  cache público, MinIO e tamanho dos arquivos: aprovados.
- Testes negativos cobrem links privados/assinados, protocolo inseguro,
  credenciais, perguntas e ausência de mutação dos registros originais.
- A conferência após publicação deve validar os novos resumos, as imagens na
  extensão do sitemap e a igualdade do canonical entre os dois caminhos do produto.

## Resultado em produção

Versão do Worker `b1fab2c6-bf05-4785-a77d-5c5f86d82dde`, com 100% de distribuição,
confirmada no histórico de implantações. Código publicado nos commits `0ca728e`
e `0c00347`. Uma consulta inicial ainda encontrou a versão anterior; a conferência
foi repetida após a ativação, sem considerar a tentativa inicial como sucesso.

Os dez produtos responderam 200, com um H1 e canonical próprio. Todos exibiram a
galeria no HTML inicial e entre duas e sete imagens públicas no JSON-LD. Oito dos
dez resumos mudaram; os outros dois mantiveram o conteúdo anterior por não haver
uma frase candidata mais adequada. O sitemap respondeu 200: continuam 380 URLs
de página, agora com 1.178 referências de imagem, antes 265. São referências
ligadas aos produtos, não 1.178 imagens únicas nem 1.178 páginas novas.

As galerias dos dez produtos e as verificações de disponibilidade das 58 imagens
no MinIO passaram. Isso não resolve o cabeçalho das quatro capas antigas no
Supabase apontadas acima, nem comprova que o Google já rastreou as mudanças.

O efeito sobre cliques e posições depende de novos rastreamentos e da competição
em cada consulta. Não interpretar aumento de imagens no sitemap como aumento de
URLs indexadas ou como promessa de primeiro lugar.

## Arquivos alterados

| Arquivo | Motivo |
|---|---|
| src/lib/seo.ts | Seletor compartilhado de imagens públicas, sem links temporários ou arquivos pagos. |
| src/lib/catalog-seo.ts | Resumos extraídos do conteúdo e galeria em Product; propriedades PLR coerentes. |
| src/lib/seo-public-catalog.ts | Relação pública de galerias na consulta existente e versão de cache. |
| src/lib/catalog-sitemap.ts | Listar imagens públicas junto ao produto canônico. |
| src/components/store/ProductPublicSummary.tsx | Galeria acessível no HTML inicial, com lazy loading e dimensões. |
| src/components/store/ProductSelectionGuide.tsx | Evitar repetir o título e duplicar pontuação no guia. |
| scripts/verify-image-search-seo.cjs | Testes de fatos, URLs privadas, SSR, JSON-LD, sitemap e PLR. |
| ops/SEO-IMAGENS-RESUMOS-2026-10-17.md | Evidências, limites, validação e inventário. |

Referências: [sitemap de imagens](https://developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps),
[boas práticas de imagens](https://developers.google.com/search/docs/appearance/google-images),
[interpretação de robots.txt](https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec).
