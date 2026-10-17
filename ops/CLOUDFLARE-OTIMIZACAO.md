# Otimização da Cloudflare — 11/10/2026 (UTC: 12/10)

Publicado em https://www.educalizando.com.br, Worker `educalizando-app`, versão final `12564c3b-69f6-4d1a-b4b9-b5f14486d300`.

## Diagnóstico com dados reais

Na leitura inicial, as últimas 24 horas continham 797 erros `exceededResources` e 10 `scriptThrewException`. A última hora tinha 245 execuções bem-sucedidas e zero erros. Logo, não foi atribuída toda a contagem histórica ao problema de configuração do Supabase, nem declarado que havia 807 erros atuais.

A homepage enviada pelo servidor tinha 798.980 bytes sem compressão. A amostra de 100 produtos incluía descrições completas, links de arquivos e campos que os cards não utilizam. Os arquivos JS estáticos já retornavam `immutable` e `CF-Cache-Status: HIT`; isso foi preservado, sem criar uma regra indiscriminada de cache.

## Mudanças publicadas

- A consulta de produtos da homepage agora pede somente campos de vitrine. Outros consumidores continuam usando a consulta completa por padrão. Os mesmos 100 produtos, filtros, ordenação e atualização de 60 segundos foram mantidos.
- A apresentação enviada aos componentes interativos contém somente dados necessários: preços, título completo, imagem, criador, formato, PLR e tags. Combos mantêm todos os produtos para o cálculo de quantidade/economia, mas não duplicam `kit_items` nem enviam arquivos de entrega. Os registros no banco não foram alterados.
- Pré-carregamento automático foi desativado nos links dos cards de produto e nas lojas da faixa da homepage. A navegação por clique permanece; a troca inicial de página pode precisar fazer a consulta nesse momento em vez de fazê-la antecipadamente.
- Imagens de `/api/storage/public-image` usam Cache API local na Cloudflare depois de validar bucket e prefixo públicos. A chave contém somente host, caminho, bucket e chave do objeto. Não são armazenados erros ou conteúdo que não seja imagem. Gravação em cache acontece em segundo plano com `after`.
- Imagens e mídias públicas são enviadas como stream, evitando uma cópia integral adicional em memória. O cliente S3 é reutilizado dentro do Worker e recriado se sua configuração mudar. Downloads privados mantêm suas verificações originais.
- O cache KV é separado por hash das fontes/configuração/variáveis públicas. Isso evita reaproveitar HTML e referências a bundles de versões anteriores. As entradas antigas expiram normalmente; não foram apagados dados ou namespaces.
- O ponto de entrada da Cloudflare aplica `private, no-store` a login, segurança, recuperação, áreas autenticadas, checkout, APIs não públicas, respostas com cookies, requisições autorizadas e mutações. A regra mantém os códigos, corpo e cookies das respostas. O cache interno de templates anônimos do framework não implica permissão de armazenamento HTTP compartilhado; a política final é aplicada após o framework.
- Login, entrada, segurança e recuperação também declaram renderização dinâmica. A checagem de configuração pública do Supabase antes do deploy continua ativa.

## Verificação e resultados

- Consulta compacta validada por leitura pública no Supabase: 100 produtos reais, 93.828 bytes de JSON. Sem gravações no banco.
- Teste da apresentação com a mesma amostra local: 250.024 para 101.739 bytes, redução de 59%. Títulos, preços, tags, quantidade/economia dos combos e sinalização de PLR preservados; arquivos privados excluídos da apresentação.
- Testes isolados de cache: bucket privado recusado antes de ler o armazenamento; bytes do stream preservados; segunda leitura de imagem usa o cache; páginas privadas e respostas com cookies conservam `no-store` e cookies.
- Build Cloudflare passou. ESLint sem erros; há um aviso de estilo `import/no-anonymous-default-export` no objeto de entrada do Worker, sem efeito funcional. Os seis diagnósticos preexistentes dos tipos gerados em `.next` continuam registrados separadamente.
- Depois da publicação: homepage 617.699 bytes, cerca de **23% menor** que os 798.980 bytes iniciais. Medida de corpo descomprimido, não de transferência comprimida nem de tempo total percebido pelo usuário. Cache da homepage atingiu `HIT` após aquecimento.
- Imagem real de 29.152 bytes: `MISS`, `HIT`, `HIT`, com mesmo conteúdo/tamanho. Bucket privado continuou retornando 404.
- Login, entrada, segurança e recuperação retornaram HTTP 200 e `no-store` em requisições repetidas. Dashboard anônimo continuou redirecionando ao login.
- Supabase Auth retornou HTTP 200. Formulário de login usa o projeto e a chave pública corretos; o envio foi interceptado para não tentar autenticar uma conta real nem enviar e-mails.
- Playwright no domínio oficial: **11 testes passaram** — oito larguras, menu/Escape/foco, busca/carrinho/entrada e ordem das seções.
- Métricas finais da última hora: 401 execuções bem-sucedidas, quatro desconexões de cliente e zero erros. A janela contém tráfego anterior e os testes; não é uma comparação controlada de CPU. Não foi prometida uma porcentagem de redução de CPU, nem estimado ganho financeiro sem dados posteriores.

## Limites

Nenhum plano pago, limite de CPU ou recurso pago novo foi ativado. Não foi aplicado “cache para tudo”. Banco, preços, pagamentos, permissões de compra, arquivos de entrega e notificações não foram modificados. O sitemap público existente foi preservado no pacote. Não houve commit nem push. Falhas históricas continuam aparecendo enquanto estiverem dentro da janela de 24 horas. A ausência de erro na última hora não garante ausência de erro futuro em todas as rotas.

Logs locais ignorados pelo Git: `.cloudflare/performance-before.json`, `performance-after.json`, `performance-browser.txt` e `performance-release-deploy.txt`. Teste reutilizável: `scripts/verify-cloudflare-performance.mjs`.

Referências consultadas: [métricas GraphQL](https://developers.cloudflare.com/analytics/graphql-api/tutorials/querying-workers-metrics/), [cache de Workers](https://developers.cloudflare.com/workers/reference/how-the-cache-works/), [arquivos estáticos](https://developers.cloudflare.com/workers/static-assets/headers/), além dos guias locais do Next/Vinext instalados.
