# Otimizações para Workers Free — 12/10/2026

Deploy confirmado: `be91f9a0-e481-48f0-8fa8-1c048f5d79df`.

## Implementação

- Cache de documentos públicos na entrada do Worker, antes de executar Vinext/React. Duração de 60 segundos e namespace exclusivo por versão de código/configuração.
- Elegibilidade exige rota pública explicitamente marcada, HTTPS e domínio oficial, GET sem parâmetros, cookies, Authorization, Range ou cabeçalhos de navegação React.
- Somente respostas 200 HTML/XML sem Set-Cookie, compressão prévia ou Vary curinga são armazenadas. Erros e respostas privadas não marcadas nunca são armazenados.
- As rotas públicas marcadas leem apenas o catálogo. O marcador permite substituir os cabeçalhos no-store padrão do framework exclusivamente na cópia interna do cache. O navegador continua com max-age=0.
- Falhas na infraestrutura de cache retornam ao processamento normal; leitura/escrita do cache não deve deixar o site indisponível.
- Menus de administração, criadores, afiliados, clientes e marketplace, rodapé, cards de lojas e temas das lojas deixam de carregar antecipadamente páginas que ainda não foram abertas.
- API de produtos deixa de validar a mesma sessão no proxy e no handler. GET, POST, PUT e DELETE continuam autenticando no próprio handler, incluindo a verificação de duas etapas e de propriedade da loja.
- Busca calcula uma pontuação por produto e por consulta, reutilizando o resultado na ordenação. Isso evita normalizar descrições longas repetidamente. A correspondência por acentos, tags, descrição, formato e correção de um caractere foi preservada.
- Consultas de busca carregam apenas nome, slug, logo e identificador da loja associada, em vez de toda a configuração da loja.
- Removidos logs de cada produto durante a montagem da vitrine.

Uploads diretos ao MinIO e entrega de imagens públicas sem processamento pela aplicação permanecem ativos. Nenhum plano pago, serviço adicional, cobrança ou migration foi aplicado.

## Evidência de produção

Medição limitada a requisições de teste, pelo tail da Cloudflare. Os números não representam percentis de todo o tráfego.

- Antes: homepage registrou 161 e 144 ms de CPU; Loja da Prô, 71 e 85 ms.
- Depois: os documentos atendidos pelo cache registraram 0–1 ms de CPU na precisão do log. Uma primeira renderização da loja ainda registrou 114 ms, mostrando que a otimização elimina trabalho nas visitas seguintes, não o custo da renderização inicial.
- Homepage e loja retornaram HIT e HTML completo. Clube retornou MISS seguido de HIT e HTML completo.
- Login manteve cache privado/no-store e não teve HIT compartilhado.
- Requisições com cookies e Authorization foram testadas fora do cache. A API de produtos recusou GET/POST/PUT/DELETE sem login com 401.

## Validação local

- Suíte geral de 22 grupos passou.
- Verificação estrita de tipos e limites de tamanho passou.
- Testes de cache verificaram isolamento, variantes React, erros HTTP, marcadores, métodos e continuidade durante falhas do cache.
- Testes de autenticação dos handlers de produtos passaram sem depender do proxy.
- Testes de busca verificaram os mesmos resultados e uma única leitura da descrição por produto por consulta.
- Testes de payload público, cache de imagens e 7 cenários dos adaptadores Cloudflare passaram.
- Compilação e dry-run de produção passaram. ESLint dos arquivos de infraestrutura/lógica verificados: zero erros, um aviso preexistente de exportação anônima do Worker.

## Limites e atualização dos dados

Este trabalho não aumenta a cota diária nem o limite de CPU do plano Free. Primeiras renderizações, navegação React, pedidos com sessão, pesquisas e APIs continuam passando pelo servidor. O login ainda registrou 13–16 ms em amostras após a publicação, apesar de retornar corretamente. Não é possível garantir ausência de interrupções no plano gratuito com esta arquitetura.

Mudanças no catálogo podem demorar até 60 segundos para aparecer em documentos públicos armazenados no cache local de cada ponto de presença. O checkout e as operações privadas não usam esse cache; o preço e as permissões continuam sendo verificados no servidor. Requisições explícitas no-cache também ignoram o cache.

Se as operações que continuam dinâmicas atingirem o limite, será necessária uma mudança maior: páginas estáticas ou renderização no navegador e transferência do processamento pesado para um backend com capacidade adequada. Não foi feita uma migração de hospedagem nesta rodada.

Referências: https://developers.cloudflare.com/workers/platform/limits/ e https://developers.cloudflare.com/workers/runtime-apis/cache/.
