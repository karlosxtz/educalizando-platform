# Calendário de oportunidades do criador

Entrada: Marketing e crescimento → Calendário de oportunidades.
Rota: `/dashboard/oportunidades`.

## Comportamento

- Reutiliza as datas de referência de `school-calendar.ts`, sem modificar o calendário público.
- Exibe a próxima ocorrência de cada data, inclusive no ano seguinte, com aritmética por dia civil de São Paulo.
- Associa materiais pela data comemorativa marcada, ou por expressões específicas do título e tags. Distingue marcação no cadastro de associação sugerida.
- Mantém os rascunhos identificados; orienta revisão/publicação antes de divulgar. Produtos excluídos não entram.
- Filtros: próximos 30/90 dias ou 12 meses, mês e somente datas com materiais relacionados.
- Antecedência ajustável: 14/21/30/45 dias. Etapas: revisar (sete dias antes do início), iniciar divulgação, mostrar prévia (D-7), lembrar (D-1).
- Copiar plano inclui datas e títulos reais dos materiais. Não inventa conteúdo, preços ou descontos.
- Atalhos para editar o produto e abrir a IA com o material publicado selecionado. Não dispara geração ou publicação automaticamente.
- Atualizar catálogo recarrega alterações recentes. Erros mantêm o último carregamento completo identificado; não exibe catálogo parcial como completo.

## Dados e custo

Sem migration, tabela ou tarefa agendada nova. Não usa chamadas a modelos de IA.
API GET autenticada por JWT/cookie e segundo fator existente; loja derivada do usuário, nunca de um storeId informado pelo cliente.
Seleciona apenas id, título, status, tags e datas dos produtos da própria loja, sem URLs privadas ou arquivos. Paginação por UUID (200 por página), ordenação estável e cache privado no-store.
Cruzamento, filtros e cálculo do plano executados no navegador. Sem carregamento de capas ou processamento de imagens.

## Limites atuais

Lista de datas editoriais de referência; datas móveis (Páscoa/Carnaval) não recebem datas fixas inventadas. Primavera segue a referência editorial existente, não cálculo astronômico.
Os planos são sugestões; não há disparos, agendamento externo ou marcação persistente de tarefas. Alterar a antecedência recalcula as etapas.
Associação automática não edita as tags do cadastro; criador pode conferir e corrigir pelo atalho.

## Verificação

`node scripts/verify-creator-opportunities.cjs`: teste de associação/ausência de falsos vínculos genéricos, fronteira de dia em São Paulo, datas no ano seguinte, antecedência, não mutação, renderização React, botão real de copiar plano, rascunhos, autenticação, escopo privado, paginação e exclusão lógica.
`npm run typecheck:vinext`, ESLint dos novos módulos e `npm run test:source-size`.

## Publicação

Build completo e Wrangler dry-run passaram. Publicado no Worker `educalizando-app`, versão `53045b41-c82f-441d-b651-1cf0fe95a2d2`. Cron existente preservado.
Verificação de produção sem sessão: API retornou 401 com JSON de login e `private, no-store`. Nenhuma conta de criador estava aberta no navegador disponível; não foi realizado teste autenticado com catálogo real. Relação dos materiais, cópia e estados da interface verificados localmente com dados de teste e React real.
