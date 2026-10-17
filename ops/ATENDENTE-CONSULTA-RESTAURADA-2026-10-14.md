# Consulta do atendente n8n restaurada — 14/10/2026

Workflow: ATENDENTE EDUCALIZANDO V20 CONVERSACIONAL (0YJiXWKAq3Jng4on).

Causa confirmada na execução 127123: Consultar loja e Consultar contexto da loja recebiam HTTP 403 INTEGRATION_SUSPENDED. Teste direto com a chave já configurada confirmou o mesmo bloqueio. Execução antiga 127048 confirmou que a chave pertence à EDUCAROSE.

Após autorização explícita do usuário:
- Cortesia do módulo WhatsApp ativada somente para EDUCAROSE (ae09b6e1-f2dc-4efe-9630-fe2ca70c748d) no painel administrativo. UI confirmou Cortesia ativa.
- Mesma chave passou a responder 200 em facets e all, com 18 materiais publicados e opções PLR, categorias, níveis e temas.
- Testes reais passaram para categoria/alfabetização, tema, PLR/preço, gratuitos, combos, clubes, facetas e consulta por ID. Áreas sem registros retornam lista vazia válida.
- V20 estava desativado; versão existente 73ffc30f-5713-4902-9c49-210e3e2d3f5c publicada para retomar o webhook de atendimento.

Nenhuma alteração no código de cobranças globais, nas chaves, credenciais, catálogo ou conexões do workflow. Não foram enviadas mensagens de teste a clientes. Envio final do WhatsApp será confirmado pela próxima conversa real.
