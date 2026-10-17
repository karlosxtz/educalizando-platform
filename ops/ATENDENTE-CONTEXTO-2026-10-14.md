# Atendimento contextual — 14/10/2026

Workflow: ATENDENTE EDUCALIZANDO V20 CONVERSACIONAL (`0YJiXWKAq3Jng4on`). Versão publicada: `c5810c20-5acf-4e28-a5b0-75e13442d530`.

- Referências ao primeiro, segundo e último material usam a ordem da última apresentação e consultam novamente o ID na API. Referência ambígua continua pedindo esclarecimento.
- “Outro parecido” conserva a consulta anterior e exclui itens já apresentados; mantém preço, categoria e demais filtros da consulta.
- “Tentar novamente” repete a consulta anterior sem substituir os filtros por uma busca genérica.
- Interpretação e curadoria orientadas a combinar público, disciplina, tema e habilidade, sem tratar dados ausentes como confirmação de adequação. A qualidade semântica ainda depende do modelo e do cadastro real.
- Comparação de licenças apresenta preço/link da versão final e, quando disponível, preço/link/descrição PLR da consulta atual. Não concede direitos não cadastrados.
- Prévia pública continua enviada por link com a capa; arquivos pagos não são expostos.
- Falha de consulta recebe métrica própria e mensagem distinta de catálogo sem correspondência.
- Encaminhamento humano só é anunciado e pausa o bot quando existe número de destino válido na configuração. Número ainda não informado pelo usuário; ativação pendente.

Validação: sete configurações de nós válidas; releitura confirmou parâmetros, 55 nós, mesmas conexões e credenciais; publicação confirmada. `test-v20.mjs` e `test-v20-improvements.mjs` passaram. Não foram enviadas mensagens a clientes nos testes. O aviso preexistente do nó desconectado Avisar busca permaneceu sem alteração.
