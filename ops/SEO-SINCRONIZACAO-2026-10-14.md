# Notas sincronizadas entre Conversão e Produtos — 14/10/2026

Causas corrigidas:
- MarketingCopilot carregava a análise somente na montagem. Atualização do cadastro na página pai não atualizava productScores já carregado.
- Consulta GET de Conversão não projetava category_ids/education_level_ids, embora os sete critérios da nota aceitem várias classificações.

Implementação:
- Conversão reconcilia título, capa, nota e pendências com o produto atual gravado, mantendo métricas históricas de visitas/vendas separadas.
- Salvamento devolve a ficha editorial retornada pelo banco, além da nota calculada; páginas aplicam esse retorno imediatamente.
- Aviso de atualização por loja, na mesma aba e em outras abas, recarrega produtos/análise e invalida a auditoria antiga. Notificação contém somente ID da loja e revisão, sem dados do material.
- Leitura de Conversão inclui todas as classificações e é dinâmica; resposta permanece no-store.
- 100 não é fixado artificialmente. Se uma edição posterior retirar um critério, as duas telas refletem a nova pendência.

Validação:
- Fluxo com handlers reais e banco simulado: auditoria -> salvamento confirmado 100 -> Conversão 100 -> nova auditoria média 100, incluindo apenas categorias/níveis múltiplos sem principal.
- Teste de projeção: mock respeita os campos pedidos para detectar omissões de consulta.
- Teste de análise antiga substituída pelo cadastro salvo, métricas de vendas preservadas, notificações mesma aba/outra aba, isolamento por loja e remoção de assinaturas.
- Confiabilidade de IA, fundamentação factual, TypeScript, ESLint e tamanho. Nenhum produto real ou geração paga utilizado.
