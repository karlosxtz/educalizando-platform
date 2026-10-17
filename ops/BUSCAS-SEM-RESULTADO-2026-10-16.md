# Relatório privado de buscas sem resultado

Menu: Marketing e crescimento → Buscas sem resultado.
Rota do painel: `/dashboard/buscas-sem-resultado`.

## Ativação

Aplicar integralmente `supabase/migrations/20261016200000_create_store_search_gaps.sql` no SQL Editor, conforme preferência do proprietário. A migration não foi aplicada por ferramentas. Ela cria uma tabela e uma função de relatório, sem alterar produtos, pedidos ou pagamentos.
Antes da ativação, a interface informa que o relatório está aguardando ativação. A coleta falha silenciosamente para não interromper a busca da loja. Não há dados fictícios.

## Coleta

- Integrada ao `PublicStoreClientView`, que centraliza a busca da vitrine; não altera os temas nem o carregamento das imagens.
- Só registra quando a busca textual mostra zero produtos, após 1,6 segundo de estabilidade. Não registra digitação vazia/curta nem pesquisa com resultado.
- Catálogo carregado deve conter ao menos um produto; vitrines completamente vazias não geram registros para evitar confundir falha de carregamento com ausência de material.
- Comparação textual compartilha a mesma função da busca visível (título, descrição, tags e datas; insensível a acentos).
- Conta correspondências sem filtros para classificar `catalog` (termo não encontrou produto) ou `filters` (existe correspondência, mas os filtros/coleção ocultaram os produtos).
- Campos da tabela: ID aleatório do evento, loja, termo, termo normalizado, tipo, identificadores opcionais dos filtros, coleção, horário do servidor. Não guarda nome/ID de visitante, telefone, IP ou user agent nesta tabela.
- Rejeita padrões comuns de email/URL, muitos dígitos, markup e credenciais explícitas. Não é classificador perfeito de informações pessoais em texto livre.
- Respeita DNT, GPC, rejeição das métricas da loja, aba oculta e sinais comuns de robôs.
- Deduplicação por termo + loja + filtros durante 30 minutos na sessão do navegador, com até 100 entradas recentes. Não é contagem de pessoas únicas.
- Endpoint público exige Origin da própria origem, JSON de até 2 KB e quota de 20/min por IP informado pelo proxy Cloudflare. Não permite leitura pública dos termos.
- O dado é uma observação do resultado exibido no navegador, não uma verificação independente no servidor ou intenção comprovada de compra. O endpoint público pode receber tráfego automatizado; a quota reduz abuso, sem prometer eliminá-lo.

## Relatório

- JWT/cookie e segundo fator conforme autenticação existente; loja derivada do usuário autenticado. Ignora qualquer storeId informado pelo cliente.
- Períodos de 7/30/90 dias e tipos: todas, sem correspondência no catálogo, por filtros.
- Agrupa termos com/sem acentos; frequência, total por tipo e última ocorrência.
- Contagens calculadas no PostgreSQL sobre todos os eventos no período; os 100 termos mais frequentes são exibidos. Não amostra/trunca os totais em 2.000 linhas.
- Copiar tema, revisar catálogo, criar material e exportar lista exibida como CSV, com escape de fórmulas.
- Consultas da busca geral da plataforma não são misturadas; módulo antigo de termos populares continua intacto. Sem importação retroativa.
- Tabela com RLS, sem grants para anon/authenticated. Função de agregação executável apenas por service_role; cache da API de relatório privado e no-store.
- Não executa IA, não altera cadastros, não cria tarefas agendadas. A política de retenção automática não foi adicionada; a interface consulta no máximo 90 dias.

## Verificação

- `node scripts/verify-search-gaps.cjs`: regras de busca, dados sensíveis comuns, escopo da API, validação de origem/tamanho, modo sem migration, espera pela digitação, deduplicação, consentimento/DNT e renderização React de estados pendente/vazio/com dados.
- `node scripts/verify-search-gaps-sql.cjs`: SQL real em PGlite, migration aplicada duas vezes, RLS/grants, separação de lojas, janela temporal, tipos, idempotência por ID, agrupamento de acentos e totais com mais de 2.000 eventos.
- Typecheck Vinext, ESLint dos novos módulos, limites de tamanho e convenções de migrations.

## Publicação

Build completo e dry-run passaram. Publicado no Worker `educalizando-app`, versão `6ce7bb3a-4f8f-4bba-89d0-d49b395d68b5`, preservando o cron existente.
Verificação real de produção: GET do relatório sem sessão retornou 401 e cache privado/no-store; POST de coleta sem Origin retornou 403 e `recorded:false`. Não foram inseridas buscas fictícias em produção.
A ativação do banco permanece dependente da execução manual da migration pelo proprietário. Não houve teste autenticado com dados reais após essa execução.
